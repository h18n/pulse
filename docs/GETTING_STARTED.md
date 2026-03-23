# Getting Started with Pulse

This guide will walk you through setting up Pulse on your local machine from scratch. By the end, you'll have the full platform running — UI, backend services, and infrastructure.

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| **Node.js** | 20+ | `node --version` |
| **npm** | 10+ | `npm --version` |
| **Docker** | 24+ | `docker --version` |
| **Docker Compose** | 2.20+ | `docker compose version` |
| **Git** | Any | `git --version` |

You'll also need a **Google AI API key** for the AI Engine features (RCA, NLQ, Dashboard Generation):
- Get one free at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/h18n/pulse.git
cd pulse
```

---

## Step 2: Configure Environment Variables

Pulse uses `.env` files for configuration. Copy the templates:

```bash
# Root-level config (used by Docker Compose and backend services)
cp .env.example .env

# UI config
cp ui/.env.example ui/.env.local
```

Now edit the `.env` file and add your API key:

```bash
# Open .env in your editor and set:
GEMINI_API_KEY=your-api-key-here
```

> **Note**: The AI Engine will start without a `GEMINI_API_KEY`, but AI features (Root Cause Analysis, Natural Language Queries, Dashboard Generation) won't work.

---

## Step 3: Start Infrastructure (Docker)

Pulse uses Prometheus (metrics), Elasticsearch (alerts/logs), and Telegraf (collection):

```bash
cd infra
docker-compose up -d
```

Verify the services are running:

```bash
docker-compose ps
```

You should see:
| Service | Port | Health Check URL |
|---------|------|------------------|
| Prometheus | [localhost:9090](http://localhost:9090) | Prometheus web UI |
| Elasticsearch | [localhost:9200](http://localhost:9200) | Returns JSON with cluster info |
| Telegraf | 9273 | Metrics exporter |

> **Tip**: First startup may take a minute or two while Docker downloads images.

---

## Step 4: Start Backend Services

Open **three separate terminals** and run each service:

### Terminal 1 — Alert Ingestion (port 3001)
```bash
cd apps/alert-ingestion
npm install
npm run dev
```

### Terminal 2 — AI Engine (port 3002)
```bash
cd apps/ai-engine
npm install
npm run dev
```

### Terminal 3 — Config Manager (port 3003)
```bash
cd apps/config-manager
npm install
npm run dev
```

> **Optional**: If you've configured Slack tokens in `.env`, you can also start the Slack bot:
> ```bash
> cd apps/slack-pacer
> npm install
> npm run dev
> ```

---

## Step 5: Start the UI

```bash
cd ui
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Log In

Use these demo credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@pulse.io | admin123 |
| **Viewer** | viewer@pulse.io | viewer123 |

---

## Step 6: Explore!

Once logged in, here are the key areas to explore:

| Page | URL | What it does |
|------|-----|--------------|
| **Dashboards** | `/dashboards` | Create and manage monitoring dashboards |
| **Explore → Logs** | `/explore/logs` | Search and filter log entries |
| **Explore → Metrics** | `/explore/metrics` | Query Prometheus metrics with PromQL |
| **Alerts** | `/alerts` | View and manage active alerts |
| **AI Copilot** | `/copilot` | Ask questions in natural language |
| **Devices** | `/devices` | Monitor infrastructure inventory |
| **Service Map** | `/devices/service-map` | Interactive service topology |
| **Incidents** | `/incidents` | Track and manage incidents |

---

## Troubleshooting

### Docker issues

| Problem | Solution |
|---------|----------|
| `port already in use` | Stop the conflicting service: `lsof -i :9090` to find it |
| Elasticsearch exits immediately | Increase Docker memory to 4GB+ in Docker Desktop preferences |
| `docker-compose` not found | Use `docker compose` (v2 syntax) instead |

### Backend service issues

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on Elasticsearch | Make sure Docker infra is running: `cd infra && docker-compose ps` |
| AI features return errors | Check that `GEMINI_API_KEY` is set in your `.env` file |
| `MODULE_NOT_FOUND` | Run `npm install` in the service directory |

### UI issues

| Problem | Solution |
|---------|----------|
| Login doesn't work | Make sure `ui/.env.local` exists (copy from `ui/.env.example`) |
| Blank page after login | Clear browser cache and reload |
| Data not loading | Check that backend services are running on their expected ports |

---

## Project Architecture

For a deep dive into how Pulse is built, see:

- **[Architecture](../ARCHITECTURE.md)** — System design, service inventory, API reference
- **[API Specification](API_SPECIFICATION.md)** — Full REST API documentation
- **[Design System](DESIGN_SYSTEM.md)** — UI components and styling guide
- **[Testing Strategy](TESTING_STRATEGY.md)** — How to write and run tests

---

## Next Steps

- **Want to contribute?** See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Found a bug?** [Open an issue](https://github.com/h18n/pulse/issues)
- **Have questions?** [Start a discussion](https://github.com/h18n/pulse/discussions)
