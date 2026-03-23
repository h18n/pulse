# Pulse API Specification

This document provides a high-level overview of the internal REST APIs powering the Pulse backend. Pulse relies on a microservices architecture communicating via REST APIs.

## Base URLs
*   Alert Ingestion Service: `http://localhost:3001`
*   AI Engine Service: `http://localhost:3002`

---

## 1. Telemetry & Traces API (Alert Ingestion Service)

### `GET /api/traces`
Search and list recent distributed traces.
*   **Query Parameters:**
    *   `service` (string): Filter by OpenTelemetry service name.
    *   `limit` (number): Maximum traces to return (default 50).
*   **Response:** `200 OK`
    ```json
    { "traces": [...], "total": 120 }
    ```

### `GET /api/traces/:traceId`
Get the full timeline waterfall (spans) for a specific trace.
*   **Response:** `200 OK`
    ```json
    { "traceId": "1a2b...", "spans": [...] }
    ```

---

## 2. Alert Webhooks

### `POST /webhooks/prometheus`
Accepts standard Prometheus Alertmanager payloads.
*   **Body Payload:**
    ```json
    {
      "alerts": [
        { "status": "firing", "labels": { "severity": "critical" } }
      ]
    }
    ```
*   **Response:** `200 OK`
    ```json
    { "status": "ok" }
    ```

---

## 3. AI Copilot API (AI Engine Service)

### `POST /api/analyze`
Submits raw logs or metrics to the Gemini AI Engine for Root Cause Analysis.
*   **Body Payload:**
    ```json
    { "query": "Why did checkout fail?", "context": { "traceId": "123" } }
    ```
*   **Response:** `200 OK` (Stream)
    Returns a Markdown-formatted stream detailing potential root causes.
