# Pulse UI

The frontend for Pulse - an AI-Powered Observability Platform.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: Version 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui patterns
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (dashboard)/        # Dashboard route group
│   │   ├── dashboards/     # Dashboard CRUD
│   │   ├── alerts/         # Alerts & correlation
│   │   ├── automation/     # Runbook automation
│   │   ├── devices/        # Device & sensor monitoring
│   │   ├── explore/        # Logs, Metrics, Global queries
│   │   ├── incidents/      # Incident management
│   │   └── copilot/        # AI chat
│   ├── api/                # API routes
│   └── login/              # Authentication
├── components/             # Reusable components
│   ├── ui/                 # Base components (Modal, Button, etc.)
│   ├── layout/             # Shell, Sidebar, Header
│   ├── dashboard/          # Dashboard widgets & panels
│   ├── alerts/             # Alert & correlation components
│   ├── automation/         # Runbook manager
│   ├── devices/            # Device & sensor components
│   ├── explore/            # Global query explorer
│   └── providers/          # Context providers
├── lib/                    # Services & utilities
│   ├── utils.ts            # General utilities
│   ├── websocket.ts        # Real-time WebSocket
│   ├── thanos.ts           # Global metric queries
│   ├── mqtt.ts             # IoT sensor service
│   ├── correlation.ts      # Event correlation engine
│   └── runbook.ts          # Automation engine
├── stores/                 # Zustand state management
│   └── dashboardStore.ts   # Dashboard state
└── types/                  # TypeScript types
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/dashboards` | Dashboard list with folder organization |
| `/dashboards/[id]` | View/edit dashboard |
| `/explore` | Exploration hub |
| `/explore/logs` | Logs explorer with level filtering |
| `/explore/metrics` | Prometheus metrics explorer |
| `/explore/global` | Cross-region Thanos queries |
| `/alerts` | Active alerts with inline details |
| `/alerts/correlation` | Correlation rules manager |
| `/automation` | Runbook automation |
| `/incidents` | Incident management |
| `/devices` | Device inventory |
| `/devices/service-map` | Service topology |
| `/devices/sensors` | MQTT sensor dashboard |
| `/copilot` | AI assistant |

## Key Features

- **Dashboard System**: Full CRUD with drag-drop panels, resize, and sharing
- **Real-time Updates**: WebSocket integration for live data
- **Correlation Engine**: Detect complex attack patterns
- **Runbook Automation**: Automated incident response workflows
- **Thanos Integration**: Cross-region metric queries
- **MQTT Sensors**: IoT device monitoring
- **Dark/Light Theme**: Full theme support with system preference

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Environment Variables

Create `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_THANOS_URL=http://localhost:9090
NEXT_PUBLIC_ENABLE_AI_COPILOT=true
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://docs.pmnd.rs/zustand)
