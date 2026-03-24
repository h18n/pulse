import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

// This would typically be imported from a shared module
// For now, we'll access the dashboards from the parent route
// In production, these would be database calls

// Mock dashboards storage (shared with parent route in production)
const getDashboardById = async (id: string) => {
    // Mock data - in production this would be a database query
    const mockDashboards: Record<string, any> = {
        'dash_1': {
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
        'dash_2': {
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
        'dash_3': {
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
        'dash_4': {
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
        'dash_5': {
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
    };

    return mockDashboards[id] || null;
};

// GET /api/dashboards/[id] - Get single dashboard
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dashboard = await getDashboardById(id);

    if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    return NextResponse.json(dashboard);
}

// PUT /api/dashboards/[id] - Update dashboard
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user?.role;
    if (userRole !== 'admin' && userRole !== 'editor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const dashboard = await getDashboardById(id);

    if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    try {
        const body = await req.json();

        const updated = {
            ...dashboard,
            ...body,
            id, // Preserve ID
            version: dashboard.version + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user?.email || 'unknown',
        };

        // In production, save to database here

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

// DELETE /api/dashboards/[id] - Delete dashboard
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin required' }, { status: 403 });
    }

    const { id } = await params;
    const dashboard = await getDashboardById(id);

    if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // In production, delete from database

    return new NextResponse(null, { status: 204 });
}
