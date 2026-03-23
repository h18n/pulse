# Architecture & Implementation Plan: Pulse Observability

## 1. Mission Statement
To make the network **observable**, **reliable**, and **automated** by providing a high-performance, AI-driven infrastructure monitoring platform.

---

## 2. System Architecture Overview

The system is designed with a "Flywheel" architecture where data flows from collection to storage, triggers alerts, feeds into an AI engine for enrichment, and finally informs human operators through a unified dashboard and interactive agents.

### High-Level Diagram (Conceptual)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                     │
│  │  Routers  │  │  Switches │  │    PDUs   │  │  Sensors  │                     │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                     │
│        │              │              │              │                            │
│        └──────────────┴──────────────┴──────────────┘                            │
│                              │                                                   │
│                    SNMP / gNMI / Ping / HTTP                                     │
└────────────────────────────────┼─────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         COLLECTION LAYER                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        Telegraf Fleet                                    │    │
│  │   • Multi-protocol support (SNMP, gNMI, Ping, HTTP)                     │    │
│  │   • Dynamic configuration from Config Manager                            │    │
│  │   • Regional deployment for low latency                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              │ Prometheus Remote Write                           │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      Config Manager (3003)                               │    │
│  │   • Device Inventory CRUD                                                │    │
│  │   • Telegraf TOML Generation                                             │    │
│  │   • Auto-onboarding                                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                                           │
│  ┌────────────────────────────┐    ┌────────────────────────────┐               │
│  │    Prometheus (9090)       │    │      Thanos (Future)       │               │
│  │   • Real-time metrics      │───▶│   • Long-term storage      │               │
│  │   • 15-day retention       │    │   • Global query view      │               │
│  │   • Alert rules            │    │   • Object storage         │               │
│  └────────────────────────────┘    └────────────────────────────┘               │
│              │                                                                   │
│              │ Alertmanager Webhook                                              │
│              ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                   Alert Ingestion (3001)                                 │    │
│  │   • Deduplication by fingerprint                                         │    │
│  │   • Stateful updates (edit vs create)                                    │    │
│  │   • Metadata enrichment                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│              │                                                                   │
│              ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                   Elasticsearch (9200)                                   │    │
│  │   • Alert index (pulse-alerts)                                        │    │
│  │   • Metadata index                                                       │    │
│  │   • Historical analysis                                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INTELLIGENCE LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      AI Engine (3002)                                    │    │
│  │   • Root Cause Analysis (RCA)                                            │    │
│  │   • Natural Language Queries                                             │    │
│  │   • Trend Analysis                                                       │    │
│  │   • Powered by Gemini 2.0 Flash                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│              │                                                                   │
│              ├──────────────────────────────────────────────┐                    │
│              ▼                                              ▼                    │
│  ┌────────────────────────────┐    ┌────────────────────────────┐               │
│  │   Slack Pacer Bot          │    │     Custom Dashboard UI    │               │
│  │   • /pulse-trends       │    │     • Flexible grid layout │               │
│  │   • /pulse-rca          │    │     • Widget library       │               │
│  │   • @mention queries       │    │     • AI Copilot chat      │               │
│  └────────────────────────────┘    └────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Inventory

| Service | Port | Description |
|---------|------|-------------|
| **Prometheus** | 9090 | Time-series database for metrics |
| **Elasticsearch** | 9200 | Alert storage and search |
| **Telegraf** | 9273 | Metrics collection agent |
| **Alert Ingestion** | 3001 | Prometheus webhook handler |
| **AI Engine** | 3002 | RCA, NLQ, and trend analysis |
| **Config Manager** | 3003 | Device inventory and Telegraf config |
| **Dashboard UI** | 3000 | Next.js frontend |
| **Slack Pacer** | Socket Mode | Interactive Slack bot |

---

## 4. API Reference

### Alert Ingestion (port 3001)
```
POST /webhooks/prometheus
  - Receives Prometheus Alertmanager webhooks
  - Deduplicates and enriches alerts
  - Stores in Elasticsearch
```

### AI Engine (port 3002)

#### Root Cause Analysis
```
POST /api/rca
  Body: { alertFingerprint: string }
  - Runs AI-powered root cause analysis
  - Returns: { alert, analysis: RCASummary, source: 'cached'|'generated' }

POST /api/arca/trigger
  Body: { alertFingerprint: string, alertId: string, severity: string }
  - Queues automated RCA job for background processing
  - Returns: { jobId, priority }

GET /api/arca/status
  - Returns queue statistics and active job counts
```

#### Natural Language Query
```
POST /api/query
  Body: { question: string }
  - Natural language query interface
  - Returns: { question, answer, alertsAnalyzed, generatedAt }
```

#### Trend Analysis
```
GET /api/trends?hours=24&siteCode=NYC-DC-01
  - Alert trend aggregations by severity, status, and time
```

#### Predictive Forecasting ✨NEW
```
POST /api/forecast
  Body: { 
    expr: string,           // PromQL expression
    forecastHours?: number, // Hours to forecast (default: 24)
    lookbackHours?: number, // Historical data range (default: 168)
    threshold?: number      // Alert threshold for breach prediction
  }
  - Generates time-series forecast using linear regression
  - Returns: {
      currentValue, predictedValue,
      trend: { perHour, perDay, direction },
      timeToThreshold: { hours, breachTime } | null,
      historical, forecast, confidence
    }
```

#### Dashboard Generation ✨NEW
```
POST /api/generate-dashboard
  Body: { 
    prompt: string,   // Natural language description
    preview?: boolean // If true, don't auto-create (default: true)
  }
  - Generates complete dashboard from natural language
  - Returns: { dashboard: GeneratedDashboard, preview, metricsAvailable }

GET /api/metrics/discover?pattern=node_*
  - Discovers available Prometheus metrics
  - Returns: { metrics: string[], count: number }
```

### Config Manager (port 3003)
```
GET    /api/devices           - List all devices
GET    /api/devices/:id       - Get single device
POST   /api/devices           - Create device
PUT    /api/devices/:id       - Update device
DELETE /api/devices/:id       - Delete device

GET    /api/config/telegraf/:region  - Generate Telegraf TOML
GET    /api/regions                  - List available regions
```

---

## 5. Frontend Pages

| Route | Description |
|-------|-------------|
| `/dashboards` | Dashboard list homepage with folders |
| `/dashboards/new` | Create new dashboard (edit mode) |
| `/dashboards/{id}` | View dashboard |
| `/dashboards/{id}?edit=true` | Edit dashboard (in-place) |
| `/explore` | Exploration tools hub |
| `/explore/logs` | Logs Explorer with level filtering |
| `/explore/metrics` | Metrics Explorer with query history |
| `/explore/global` | Thanos Global Query Explorer ✨NEW |
| `/alerts` | Active alerts with inline details |
| `/alerts/rules` | Alert rule management |
| `/alerts/channels` | Notification channels |
| `/alerts/correlation` | Correlation Rules Manager ✨NEW |
| `/automation` | Runbook Automation Manager ✨NEW |
| `/incidents` | Incident management and filtering |
| `/devices` | Device inventory CRUD |
| `/devices/service-map` | Service topology map |
| `/devices/sensors` | MQTT Sensor Dashboard ✨NEW |
| `/copilot` | AI chat interface |
| `/settings` | System configuration |

---

## 6. Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- npm

### Quick Start

1. **Start Infrastructure**
   ```bash
   cd infra
   docker-compose up -d prometheus elasticsearch telegraf
   ```

2. **Start Backend Services**
   ```bash
   # Terminal 1 - Alert Ingestion
   cd apps/alert-ingestion && npm install && npm run dev
   
   # Terminal 2 - AI Engine
   cd apps/ai-engine && npm install && npm run dev
   
   # Terminal 3 - Config Manager
   cd apps/config-manager && npm install && npm run dev
   ```

3. **Start Dashboard UI**
   ```bash
   cd ui && npm install && npm run dev
   ```

4. **Optional: Start Slack Bot**
   ```bash
   # Set environment variables first
   export SLACK_BOT_TOKEN=xoxb-...
   export SLACK_SIGNING_SECRET=...
   export SLACK_APP_TOKEN=xapp-...
   
   cd apps/slack-pacer && npm install && npm run dev
   ```

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `ELASTICSEARCH_URL` | alert-ingestion, ai-engine | ES connection |
| `PROMETHEUS_URL` | alert-ingestion | Prometheus connection |
| `GEMINI_API_KEY` | ai-engine | Google AI API key |
| `SLACK_BOT_TOKEN` | slack-pacer | Slack bot token |
| `SLACK_SIGNING_SECRET` | slack-pacer | Slack signing secret |
| `SLACK_APP_TOKEN` | slack-pacer | Slack app-level token |

---

## 7. Implementation Status

### ✅ Completed
- [x] Architecture design
- [x] Docker Compose infrastructure
- [x] Prometheus configuration
- [x] Telegraf configuration (SNMP, Ping, HTTP)
- [x] Alert Ingestion Service with deduplication
- [x] AI Engine with RCA, NLQ, Trends
- [x] Config Manager with device CRUD and Telegraf TOML generation
- [x] Slack Pacer Bot with slash commands
- [x] Dashboard UI with flexible grid layout
- [x] Incidents page with filtering
- [x] Device Inventory page
- [x] AI Copilot chat interface
- [x] Theme switching (dark/light/system)
- [x] Command Palette (⌘K)
- [x] Dashboard CRUD (Create, Read, Update, Delete)
- [x] Dashboard List homepage with search & filter
- [x] Panel Editor slide-out
- [x] Panel Add/Edit/Delete
- [x] Panel Drag-and-Drop reordering
- [x] Dashboard Settings modal with danger zone
- [x] Delete Dashboard with confirmation modal
- [x] Duplicate Dashboard modal
- [x] Starred dashboards
- [x] Unsaved Changes Warning modal
- [x] Edit mode toggle with save/discard

- [x] Panel resize functionality
- [x] Query builder for panels
- [x] Folder organization for dashboards
- [x] Real-time data integration (WebSocket)
- [x] Dashboard sharing & permissions
- [x] Thanos integration for global queries
- [x] MQTT sensor integration
- [x] Correlation rule engine
- [x] Runbook automation

### ✨ Phase 1: Intelligent Observation (NEW)
- [x] **Automated Root Cause Analysis (ARCA)** - AI-powered background RCA for critical alerts
- [x] **Predictive Forecasting Widget** - Time-series predictions with threshold breach alerts
- [x] **Natural Language Dashboard Generation** - Create dashboards from text prompts
- [x] **Metric Discovery API** - Auto-discover available Prometheus metrics
- [x] **ARCA Job Queue** - Background job processing with retry logic

### 🔄 In Progress
- [ ] Multi-region deployment
- [ ] ARCA notification integration (Slack/PagerDuty)

### 📋 Planned (Phase 2)
- [ ] Blast Radius Visualization
- [ ] Contextual Collaboration (@mentions)
- [ ] Chronos Scrubber (Time Travel)
- [ ] AI-powered anomaly detection
- [ ] Custom plugin system

---

## 8. Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Backend** | Fastify, TypeScript, Slack Bolt |
| **Storage** | Prometheus, Elasticsearch, Thanos (planned) |
| **Collection** | Telegraf (SNMP, gNMI, Ping, HTTP) |
| **AI** | Google Gemini 2.0 Flash |
| **Infrastructure** | Docker, Docker Compose |
