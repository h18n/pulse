import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import type { DashboardListItem, Folder } from "@/types/dashboard";

// In-memory storage (replace with database in production)
const dashboards = new Map<string, any>();
const starredDashboards = new Set<string>();

// Mock folders
const folders: Folder[] = [
    {
        id: 'folder_1',
        uid: 'infrastructure',
        title: 'Infrastructure',
        dashboardCount: 4,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-09T00:00:00Z',
    },
    {
        id: 'folder_2',
        uid: 'applications',
        title: 'Applications',
        dashboardCount: 2,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-09T00:00:00Z',
    },
    {
        id: 'folder_3',
        uid: 'security',
        title: 'Security',
        dashboardCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-09T00:00:00Z',
    },
];

// Initialize with demo dashboards
const initDashboards = () => {
    if (dashboards.size > 0) return;

    const demoDashboards = [
        {
            id: 'dash_1',
            uid: 'production-overview',
            title: 'Production Overview',
            description: 'Main production metrics and health indicators',
            slug: 'production-overview',
            folderId: 'folder_1',
            tags: ['production', 'infrastructure'],
            panels: [
                { id: 'p1', type: 'stat', title: 'Active Targets', gridPos: { x: 0, y: 0, w: 3, h: 2 }, targets: [{ expr: 'sum(up)' }], options: {} },
                { id: 'p2', type: 'stat', title: 'Total Memory (GB)', gridPos: { x: 3, y: 0, w: 3, h: 2 }, targets: [{ expr: 'sum(node_memory_MemTotal_bytes) / 1024 / 1024 / 1024' }], options: {} },
                { id: 'p3', type: 'stat', title: 'Avg Load (1m)', gridPos: { x: 6, y: 0, w: 3, h: 2 }, targets: [{ expr: 'avg(node_load1)' }], options: {} },
                { id: 'p4', type: 'stat', title: 'Scrape Duration', gridPos: { x: 9, y: 0, w: 3, h: 2 }, targets: [{ expr: 'avg(prometheus_target_interval_length_seconds)' }], options: {} },
                { id: 'p5', type: 'timeseries', title: 'Prometheus HTTP Requests', gridPos: { x: 0, y: 2, w: 6, h: 4 }, targets: [{ expr: 'rate(prometheus_http_requests_total[5m])' }], options: {} },
                { id: 'p6', type: 'timeseries', title: 'CPU Usage by Mode', gridPos: { x: 6, y: 2, w: 6, h: 4 }, targets: [{ expr: 'sum by (mode) (rate(node_cpu_seconds_total[5m]))' }], options: {} },
                { id: 'p7', type: 'table', title: 'Top Instances by Load', gridPos: { x: 0, y: 6, w: 12, h: 4 }, targets: [{ expr: 'topk(10, node_load1)' }], options: {} },
            ],
            timeRange: { from: 'now-1h', to: 'now' },
            refreshInterval: '30s',
            version: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-09T10:00:00Z',
            createdBy: 'user_1',
            updatedBy: 'user_1',
        },
        {
            id: 'dash_2',
            uid: 'checkout-service',
            title: 'Checkout Service Health',
            description: 'Monitoring for the checkout microservice',
            slug: 'checkout-service',
            folderId: 'folder_2',
            tags: ['checkout', 'payments', 'critical'],
            panels: [
                { id: 'p1', type: 'stat', title: 'Success Rate', gridPos: { x: 0, y: 0, w: 4, h: 2 }, targets: [{ expr: 'sum(rate(checkout_success_total[5m])) / sum(rate(checkout_total[5m])) * 100' }], options: {} },
                { id: 'p2', type: 'timeseries', title: 'Checkout Latency', gridPos: { x: 0, y: 2, w: 12, h: 4 }, targets: [{ expr: 'histogram_quantile(0.95, rate(checkout_duration_seconds_bucket[5m]))' }], options: {} },
            ],
            timeRange: { from: 'now-6h', to: 'now' },
            refreshInterval: '1m',
            version: 1,
            createdAt: '2026-01-02T00:00:00Z',
            updatedAt: '2026-01-08T15:30:00Z',
            createdBy: 'user_2',
            updatedBy: 'user_2',
        },
        {
            id: 'dash_3',
            uid: 'api-gateway-metrics',
            title: 'API Gateway Metrics',
            description: 'Request rates, latency, and error tracking',
            slug: 'api-gateway-metrics',
            folderId: 'folder_2',
            tags: ['api', 'gateway', 'latency'],
            panels: [
                { id: 'p1', type: 'stat', title: 'RPS', gridPos: { x: 0, y: 0, w: 3, h: 2 }, targets: [{ expr: 'sum(rate(gateway_requests_total[1m]))' }], options: {} },
                { id: 'p2', type: 'timeseries', title: 'Gateway Latency', gridPos: { x: 0, y: 2, w: 12, h: 4 }, targets: [{ expr: 'histogram_quantile(0.99, rate(gateway_request_duration_seconds_bucket[5m]))' }], options: {} },
            ],
            timeRange: { from: 'now-1h', to: 'now' },
            version: 1,
            createdAt: '2026-01-03T00:00:00Z',
            updatedAt: '2026-01-07T09:00:00Z',
            createdBy: 'user_1',
            updatedBy: 'user_1',
        },
        {
            id: 'dash_4',
            uid: 'network-performance',
            title: 'Network Performance',
            description: 'Bandwidth, packet loss, and connectivity',
            slug: 'network-performance',
            folderId: 'folder_1',
            tags: ['network', 'infrastructure'],
            panels: [
                { id: 'p1', type: 'gauge', title: 'Bandwidth Usage', gridPos: { x: 0, y: 0, w: 4, h: 3 }, targets: [{ expr: 'sum(rate(network_bytes_total[5m]))' }], options: {} },
            ],
            timeRange: { from: 'now-24h', to: 'now' },
            version: 1,
            createdAt: '2026-01-04T00:00:00Z',
            updatedAt: '2026-01-09T14:00:00Z',
            createdBy: 'user_3',
            updatedBy: 'user_3',
        },
        {
            id: 'dash_5',
            uid: 'kubernetes-cluster',
            title: 'Kubernetes Cluster',
            description: 'Pod status, resource usage, and node health',
            slug: 'kubernetes-cluster',
            folderId: 'folder_1',
            tags: ['kubernetes', 'k8s', 'containers'],
            panels: [
                { id: 'p1', type: 'stat', title: 'Running Pods', gridPos: { x: 0, y: 0, w: 3, h: 2 }, targets: [{ expr: 'count(kube_pod_status_phase{phase="Running"})' }], options: {} },
                { id: 'p2', type: 'stat', title: 'Nodes Ready', gridPos: { x: 3, y: 0, w: 3, h: 2 }, targets: [{ expr: 'count(kube_node_status_condition{condition="Ready",status="true"})' }], options: {} },
            ],
            timeRange: { from: 'now-1h', to: 'now' },
            refreshInterval: '15s',
            version: 1,
            createdAt: '2026-01-06T00:00:00Z',
            updatedAt: '2026-01-09T08:00:00Z',
            createdBy: 'user_1',
            updatedBy: 'user_1',
        },
    ];

    demoDashboards.forEach(d => dashboards.set(d.id, d));
    // Star some dashboards
    starredDashboards.add('dash_1');
    starredDashboards.add('dash_2');
    starredDashboards.add('dash_5');
};

const userMap: Record<string, string> = {
    'user_1': 'Sarah Chen',
    'user_2': 'Marcus Johnson',
    'user_3': 'Priya Sharma',
};

// GET /api/dashboards - List all dashboards
export async function GET(req: NextRequest) {
    initDashboards();

    const session = await getAuthSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert to list format
    const dashboardList: DashboardListItem[] = Array.from(dashboards.values()).map((d) => {
        const folder = folders.find(f => f.id === d.folderId);
        return {
            id: d.id,
            uid: d.uid,
            title: d.title,
            description: d.description,
            folderId: d.folderId,
            folderTitle: folder?.title,
            tags: d.tags || [],
            panelCount: d.panels?.length || 0,
            starred: starredDashboards.has(d.id),
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            createdBy: {
                id: d.createdBy,
                name: userMap[d.createdBy] || 'Unknown',
            },
        };
    });

    return NextResponse.json({
        dashboards: dashboardList,
        folders,
    });
}

// POST /api/dashboards - Create dashboard
export async function POST(req: NextRequest) {
    initDashboards();

    const session = await getAuthSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user?.role;
    if (userRole !== "admin" && userRole !== "editor") {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    try {
        const body = await req.json();

        if (!body.title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const id = `dash_${Date.now()}`;
        const uid = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const dashboard = {
            id,
            uid,
            title: body.title,
            description: body.description || '',
            slug: uid,
            folderId: body.folderId,
            tags: body.tags || [],
            panels: body.panels || [],
            timeRange: { from: 'now-1h', to: 'now' },
            refreshInterval: '30s',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: session.user?.email || 'unknown',
            updatedBy: session.user?.email || 'unknown',
        };

        dashboards.set(id, dashboard);

        return NextResponse.json(dashboard, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}

