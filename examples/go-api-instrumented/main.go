package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// InitProvider sets up the OpenTelemetry trace provider to send to Pulse
func InitProvider() (*sdktrace.TracerProvider, error) {
	ctx := context.Background()

	// Connect to the Pulse OTel Collector (gRPC default on 4317)
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint("localhost:4317"),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize exporter: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String("go-inventory-service"),
			semconv.ServiceVersionKey.String("1.0.0"),
		)),
	)
	
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	return tp, nil
}

func inventoryHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tracer := otel.Tracer("inventory-handler")
	_, span := tracer.Start(ctx, "ProcessInventory")
	defer span.End()

	// Simulate work and random latency
	sleepTime := time.Duration(rand.Intn(100)+50) * time.Millisecond
	time.Sleep(sleepTime)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success", "items":42}`))
}

func main() {
	tp, err := InitProvider()
	if err != nil {
		log.Fatalf("Error setting up OTel provider: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Fatalf("Error shutting down tracer provider: %v", err)
		}
	}()

	mux := http.NewServeMux()
	
	// Automatically instrument HTTP routes
	handler := otelhttp.NewHandler(http.HandlerFunc(inventoryHandler), "InventoryRead")
	mux.Handle("/inventory", handler)

	log.Println("Go API listening on port 8080. GET /inventory to generate traces.")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
