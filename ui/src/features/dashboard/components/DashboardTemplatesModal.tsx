"use client";

import React from 'react';
import {
    X,
    LayoutGrid,
    Server,
    Gauge,
    Activity,
    Database,
    Globe,
    Clock
} from 'lucide-react';
import { Dashboard, useDashboardStore } from '@/stores/dashboardStore';

interface DashboardTemplatesModalProps {
    onClose: () => void;
}

interface Template {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    dashboard: any;
}

const TEMPLATES: Template[] = [
    {
        id: 'network-overview',
        name: 'Network Overview',
        description: 'Monitor network traffic, latency, and connectivity',
        icon: <Globe size={24} />,
        category: 'Infrastructure',
        dashboard: {
            uid: 'network-overview',
            title: 'Network Overview',
            description: 'Network infrastructure monitoring dashboard',
            tags: ['network', 'infrastructure'],
            timezone: 'browser',
            editable: true,
            time: { from: 'now-1h', to: 'now' },
            timepicker: { refresh_intervals: ['5s', '10s', '30s', '1m'] },
            refresh: '10s',
            templating: { list: [] },
            annotations: { list: [] },
            links: [],
            panels: [
                {
                    id: "1",
                    type: 'stat',
                    title: 'Total Bandwidth',
                    gridPos: { x: 0, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: 'sum(rate(node_network_receive_bytes_total[5m]))' }],
                    options: { colorMode: 'value', graphMode: 'area' },
                    fieldConfig: { defaults: { unit: 'bytes' }, overrides: [] },
                },
                {
                    id: "2",
                    type: 'stat',
                    title: 'Active Connections',
                    gridPos: { x: 6, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { colorMode: 'value', graphMode: 'area' },
                    fieldConfig: { defaults: {}, overrides: [] },
                },
                {
                    id: "3",
                    type: 'gauge',
                    title: 'Network Health',
                    gridPos: { x: 12, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: {},
                    fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 }, overrides: [] },
                },
                {
                    id: "4",
                    type: 'statusgrid',
                    title: 'Endpoint Status',
                    gridPos: { x: 18, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { columns: 6 },
                    fieldConfig: { defaults: {}, overrides: [] },
                },
                {
                    id: "5",
                    type: 'timeseries',
                    title: 'Network Traffic',
                    gridPos: { x: 0, y: 4, w: 12, h: 8 },
                    targets: [
                        { refId: 'A', expr: 'rate(node_network_receive_bytes_total[5m])', legendFormat: 'Inbound' },
                        { refId: 'B', expr: 'rate(node_network_transmit_bytes_total[5m])', legendFormat: 'Outbound' },
                    ],
                    options: { legend: { showLegend: true } },
                    fieldConfig: { defaults: { unit: 'bytes' }, overrides: [] },
                },
                {
                    id: "6",
                    type: 'timeseries',
                    title: 'Latency by Region',
                    gridPos: { x: 12, y: 4, w: 12, h: 8 },
                    targets: [{ refId: 'A', expr: '', legendFormat: 'Latency' }],
                    options: { legend: { showLegend: true } },
                    fieldConfig: { defaults: { unit: 'ms' }, overrides: [] },
                },
            ],
            version: 1,
            schemaVersion: 1,
        },
    },
    {
        id: 'server-health',
        name: 'Server Health',
        description: 'CPU, memory, disk, and process monitoring',
        icon: <Server size={24} />,
        category: 'Infrastructure',
        dashboard: {
            uid: 'server-health',
            title: 'Server Health',
            description: 'Server resource utilization dashboard',
            tags: ['server', 'resources'],
            timezone: 'browser',
            editable: true,
            time: { from: 'now-1h', to: 'now' },
            timepicker: { refresh_intervals: ['5s', '10s', '30s', '1m'] },
            refresh: '10s',
            templating: { list: [] },
            annotations: { list: [] },
            links: [],
            panels: [
                {
                    id: "1",
                    type: 'gauge',
                    title: 'CPU Usage',
                    gridPos: { x: 0, y: 0, w: 6, h: 5 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: {},
                    fieldConfig: {
                        defaults: {
                            unit: 'percent',
                            min: 0,
                            max: 100,
                            thresholds: {
                                mode: 'absolute', steps: [
                                    { value: 0, color: 'green' },
                                    { value: 70, color: 'yellow' },
                                    { value: 90, color: 'red' },
                                ]
                            }
                        },
                        overrides: []
                    },
                },
                {
                    id: "2",
                    type: 'gauge',
                    title: 'Memory Usage',
                    gridPos: { x: 6, y: 0, w: 6, h: 5 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: {},
                    fieldConfig: {
                        defaults: {
                            unit: 'percent',
                            min: 0,
                            max: 100,
                            thresholds: {
                                mode: 'absolute', steps: [
                                    { value: 0, color: 'green' },
                                    { value: 80, color: 'yellow' },
                                    { value: 95, color: 'red' },
                                ]
                            }
                        },
                        overrides: []
                    },
                },
                {
                    id: "3",
                    type: 'gauge',
                    title: 'Disk Usage',
                    gridPos: { x: 12, y: 0, w: 6, h: 5 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: {},
                    fieldConfig: {
                        defaults: {
                            unit: 'percent',
                            min: 0,
                            max: 100,
                            thresholds: {
                                mode: 'absolute', steps: [
                                    { value: 0, color: 'green' },
                                    { value: 75, color: 'yellow' },
                                    { value: 90, color: 'red' },
                                ]
                            }
                        },
                        overrides: []
                    },
                },
                {
                    id: "4",
                    type: 'stat',
                    title: 'Uptime',
                    gridPos: { x: 18, y: 0, w: 6, h: 5 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { colorMode: 'value', graphMode: 'none' },
                    fieldConfig: { defaults: { unit: 's' }, overrides: [] },
                },
                {
                    id: "5",
                    type: 'timeseries',
                    title: 'CPU History',
                    gridPos: { x: 0, y: 5, w: 12, h: 7 },
                    targets: [{ refId: 'A', expr: '', legendFormat: 'CPU' }],
                    options: { legend: { showLegend: true } },
                    fieldConfig: { defaults: { unit: 'percent' }, overrides: [] },
                },
                {
                    id: "6",
                    type: 'timeseries',
                    title: 'Memory History',
                    gridPos: { x: 12, y: 5, w: 12, h: 7 },
                    targets: [{ refId: 'A', expr: '', legendFormat: 'Memory' }],
                    options: { legend: { showLegend: true } },
                    fieldConfig: { defaults: { unit: 'percent' }, overrides: [] },
                },
                {
                    id: "7",
                    type: 'table',
                    title: 'Top Processes',
                    gridPos: { x: 0, y: 12, w: 24, h: 6 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { showHeader: true },
                    fieldConfig: { defaults: {}, overrides: [] },
                },
            ],
            version: 1,
            schemaVersion: 1,
        },
    },
    {
        id: 'application-metrics',
        name: 'Application Metrics',
        description: 'Request rates, error rates, and response times',
        icon: <Activity size={24} />,
        category: 'Application',
        dashboard: {
            uid: 'application-metrics',
            title: 'Application Metrics',
            description: 'Application performance monitoring',
            tags: ['application', 'apm'],
            timezone: 'browser',
            editable: true,
            time: { from: 'now-1h', to: 'now' },
            timepicker: { refresh_intervals: ['5s', '10s', '30s', '1m'] },
            refresh: '10s',
            templating: { list: [] },
            annotations: { list: [] },
            links: [],
            panels: [
                {
                    id: "1",
                    type: 'stat',
                    title: 'Request Rate',
                    gridPos: { x: 0, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { colorMode: 'value', graphMode: 'area' },
                    fieldConfig: { defaults: { unit: 'reqps' }, overrides: [] },
                },
                {
                    id: "2",
                    type: 'stat',
                    title: 'Error Rate',
                    gridPos: { x: 6, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { colorMode: 'value', graphMode: 'area' },
                    fieldConfig: {
                        defaults: {
                            unit: 'percent',
                            thresholds: {
                                mode: 'absolute', steps: [
                                    { value: 0, color: 'green' },
                                    { value: 1, color: 'yellow' },
                                    { value: 5, color: 'red' },
                                ]
                            }
                        },
                        overrides: []
                    },
                },
                {
                    id: "3",
                    type: 'stat',
                    title: 'Avg Response Time',
                    gridPos: { x: 12, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { colorMode: 'value', graphMode: 'area' },
                    fieldConfig: {
                        defaults: {
                            unit: 'ms',
                            thresholds: {
                                mode: 'absolute', steps: [
                                    { value: 0, color: 'green' },
                                    { value: 100, color: 'yellow' },
                                    { value: 500, color: 'red' },
                                ]
                            }
                        },
                        overrides: []
                    },
                },
                {
                    id: "4",
                    type: 'stat',
                    title: 'Active Users',
                    gridPos: { x: 18, y: 0, w: 6, h: 4 },
                    targets: [{ refId: 'A', expr: '' }],
                    options: { colorMode: 'value', graphMode: 'area' },
                    fieldConfig: { defaults: {}, overrides: [] },
                },
                {
                    id: "5",
                    type: 'timeseries',
                    title: 'Request Volume',
                    gridPos: { x: 0, y: 4, w: 12, h: 8 },
                    targets: [
                        { refId: 'A', expr: '', legendFormat: 'Success' },
                        { refId: 'B', legendFormat: 'Error' },
                    ],
                    options: { legend: { showLegend: true } },
                    fieldConfig: { defaults: {}, overrides: [] },
                },
                {
                    id: "6",
                    type: 'timeseries',
                    title: 'Response Time Distribution',
                    gridPos: { x: 12, y: 4, w: 12, h: 8 },
                    targets: [
                        { refId: 'A', expr: '', legendFormat: 'P50' },
                        { refId: 'B', legendFormat: 'P95' },
                        { refId: 'C', legendFormat: 'P99' },
                    ],
                    options: { legend: { showLegend: true } },
                    fieldConfig: { defaults: { unit: 'ms' }, overrides: [] },
                },
            ],
            version: 1,
            schemaVersion: 1,
        },
    },
    {
        id: 'empty',
        name: 'Empty Dashboard',
        description: 'Start from scratch with a blank canvas',
        icon: <LayoutGrid size={24} />,
        category: 'Basic',
        dashboard: {
            uid: `empty-${Date.now()}`,
            title: 'New Dashboard',
            description: '',
            tags: [],
            timezone: 'browser',
            editable: true,
            time: { from: 'now-6h', to: 'now' },
            timepicker: { refresh_intervals: ['5s', '10s', '30s', '1m', '5m'] },
            refresh: '30s',
            templating: { list: [] },
            annotations: { list: [] },
            links: [],
            panels: [],
            version: 1,
            schemaVersion: 1,
        },
    },
];

export function DashboardTemplatesModal({ onClose }: DashboardTemplatesModalProps) {
    const { loadDashboard } = useDashboardStore();

    const handleSelectTemplate = (template: Template) => {
        // Generate unique UID
        const dashboard = {
            ...template.dashboard,
            uid: `${template.id}-${Date.now()}`,
        };
        loadDashboard(dashboard);
        onClose();
    };

    const categories = [...new Set(TEMPLATES.map(t => t.category))];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div>
                        <h2 className="text-lg font-bold">Create Dashboard</h2>
                        <p className="text-sm text-muted-foreground">Choose a template to get started</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {categories.map(category => (
                        <div key={category} className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {TEMPLATES.filter(t => t.category === category).map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleSelectTemplate(template)}
                                        className="flex items-start gap-4 p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                                            {template.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium mb-1">{template.name}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {template.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashboardTemplatesModal;
