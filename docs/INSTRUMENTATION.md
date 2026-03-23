# Instrumentation Guide

Welcome! This guide explains how to get your applications sending telemetry data (Metrics, Logs, and Traces) to **Pulse**.

Pulse natively supports the **OpenTelemetry (OTel)** standard. If your application works with OpenTelemetry, it works with Pulse. There corresponds no vendor lock-in!

## 1. Pulse Telemetry Endpoints
Once you've spun up Pulse using `docker-compose up -d`, the OpenTelemetry Collector exposes the following endpoints locally:

*   **OTLP gRPC:** `localhost:4317`
*   **OTLP HTTP/Protobuf:** `localhost:4318`

> ⚠️ **Note:** If you deploy Pulse to a remote server, ensure these ports are accessible or securely reverse-proxied.

## 2. Examples / Recipes

We've provided boilerplate applications in the `examples/` directory to help you understand how to pipe data to Pulse via tracing SDKs.

### Node.js (Express)
You can find a complete, working example under `examples/nodejs-express-instrumented`.

**Quick Start:**
1. Navigate to the example: `cd examples/nodejs-express-instrumented`
2. Install dependencies: `npm install`
3. Hit the pulse data endpoints: `npm start`
4. Send a few requests to generate traces: `curl http://localhost:3005/checkout`
5. Open up Pulse and navigate to the **Trace Explorer**!

### General Guidelines
For any application you write:
- Set up the specific `opentelemetry` SDK for your language (Go, Python, Java, etc.).
- Set the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable to `http://<pulse-ip>:4318` (for HTTP).
- Define `OTEL_SERVICE_NAME` so traces and logs group together accurately.
