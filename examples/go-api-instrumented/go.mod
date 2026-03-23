module github.com/pulse-observability/go-api-instrumented

go 1.21

require (
	go.opentelemetry.io/otel v1.26.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.26.0
	go.opentelemetry.io/otel/sdk v1.26.0
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.49.0
)
