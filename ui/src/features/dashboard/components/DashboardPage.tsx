"use client";

import React, { useEffect, useState } from 'react';
import {
    Save,
    Settings,
    Share2,
    Plus,
    ChevronDown,
    LayoutGrid,
    Star,
    StarOff,
    Upload,
    Download,
    FileJson,
    History,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Dashboard, Panel } from '@/types/dashboard';
import { TimePicker } from './TimePicker';
import { ChronosScrubber } from './ChronosScrubber';

import { VariableBar } from './VariableBar';
import { DashboardCanvas } from './DashboardCanvas';
import { PanelEditor } from './PanelEditor';
import { ImportExportModal } from './ImportExportModal';
import { DashboardTemplatesModal } from './DashboardTemplatesModal';
import { getAllWidgets } from '../widgets/registry';

interface DashboardPageProps {
    dashboard?: Dashboard;
}

export function DashboardPage({ dashboard: initialDashboard }: DashboardPageProps) {
    const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

    const {
        currentDashboard: dashboard,
        loadDashboard,
        addPanel,
        saveDashboard,
        isSaving,
        hasUnsavedChanges,
        editingPanelId: panelInEdit,
        setEditingPanel,
        isScrubbing,
        toggleScrubbing
    } = useDashboardStore();

    const hasChanges = () => hasUnsavedChanges;
    const exitEditMode = () => setEditingPanel(null);


    // Load initial dashboard or create demo dashboard
    useEffect(() => {
        if (initialDashboard) {
            loadDashboard(initialDashboard);
        } else {
            // Load demo dashboard
            loadDashboard(DEMO_DASHBOARD);
        }
    }, [initialDashboard, loadDashboard]);

    if (!dashboard) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        );
    }

    const widgets = getAllWidgets();
    const editingPanel = panelInEdit ? dashboard.panels.find(p => p.id === panelInEdit) : null;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Dashboard Toolbar - Higher z-index to ensure dropdowns appear above canvas */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm relative z-[100]">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Left: Title & Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={20} className="text-primary" />
                            <h1 className="text-lg font-bold">{dashboard.title}</h1>
                            <button
                                onClick={() => setIsFavorite(!isFavorite)}
                                className="p-1 hover:bg-muted rounded"
                            >
                                {isFavorite ? (
                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                ) : (
                                    <StarOff size={16} className="text-muted-foreground" />
                                )}
                            </button>
                        </div>
                        {hasChanges() && (
                            <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-3">
                        <TimePicker />

                        <div className="h-6 w-px bg-border" />

                        {/* Add Panel */}
                        <div className="relative">
                            <button
                                onClick={() => setIsAddPanelOpen(!isAddPanelOpen)}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <Plus size={16} />
                                Add
                                <ChevronDown size={14} />
                            </button>

                            {isAddPanelOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-[9999] py-2 overflow-hidden">
                                    <button
                                        onClick={() => { setIsTemplatesOpen(true); setIsAddPanelOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left text-primary font-medium border-b border-border mb-1"
                                    >
                                        <LayoutGrid size={14} />
                                        <span>From Template...</span>
                                    </button>

                                    <p className="px-3 py-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        Visualizations
                                    </p>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {widgets.map((widget) => (
                                            <button
                                                key={widget.id}
                                                onClick={() => { addPanel({ type: widget.id as any }); setIsAddPanelOpen(false); }}
                                                className="w-full flex items-start gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                    <LayoutGrid size={14} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{widget.name}</p>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{widget.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center bg-muted/30 rounded-lg p-1 border border-border">
                            <button
                                onClick={() => toggleScrubbing(!isScrubbing)}
                                className={cn(
                                    "p-1.5 rounded-md transition-all flex items-center gap-2",
                                    isScrubbing ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                title="Time Travel (Chronos)"
                            >
                                <History size={16} />
                                {isScrubbing && <span className="text-[10px] font-bold">LIVE</span>}
                            </button>
                            <button
                                onClick={() => setImportExportMode('export')}
                                className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Export JSON"
                            >
                                <Share2 size={16} />
                            </button>
                            <button
                                onClick={() => setImportExportMode('import')}
                                className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Import JSON"
                            >
                                <Upload size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                                <Settings size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => saveDashboard()}
                            disabled={isSaving || !hasChanges()}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm",
                                hasChanges()
                                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            )}
                        >
                            <Save size={16} />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Variable Bar */}
                {dashboard.templating?.list && dashboard.templating.list.length > 0 && (
                    <div className="px-4 pb-3">
                        <VariableBar />
                    </div>
                )}
            </div>

            {/* Dashboard Canvas */}
            <div className="flex-1 overflow-auto p-4 bg-background">
                <DashboardCanvas />
            </div>

            {/* Modals */}
            {editingPanel && (
                <PanelEditor
                    panel={editingPanel}
                    onClose={() => exitEditMode()}
                />
            )}

            {importExportMode && (
                <ImportExportModal
                    mode={importExportMode}
                    onClose={() => setImportExportMode(null)}
                />
            )}

            {isTemplatesOpen && (
                <DashboardTemplatesModal
                    onClose={() => setIsTemplatesOpen(false)}
                />
            )}

            {/* Chronos Scrubber Overlay */}
            <ChronosScrubber />
        </div>
    );
}

// ============== Demo Dashboard ==============

const DEMO_DASHBOARD: Dashboard = {
    uid: 'demo-network-core',
    title: 'Network Core Performance',
    description: 'Real-time monitoring of core network infrastructure',
    tags: ['network', 'core', 'production'],
    timezone: 'browser',
    editable: true,

    time: {
        from: 'now-6h',
        to: 'now',
    },
    timepicker: {
        refresh_intervals: ['5s', '10s', '30s', '1m', '5m'],
    },
    refresh: '30s',

    templating: {
        list: [
            {
                name: 'region',
                type: 'custom',
                label: 'Region',
                hide: 0,
                options: [
                    { text: 'US-EAST', value: 'us-east', selected: true },
                    { text: 'US-WEST', value: 'us-west' },
                    { text: 'EU-WEST', value: 'eu-west' },
                    { text: 'APAC', value: 'apac' },
                ],
                current: { text: 'US-EAST', value: 'us-east' },
                multi: true,
                includeAll: true,
            },
            {
                name: 'interval',
                type: 'interval',
                label: 'Interval',
                hide: 0,
                options: [
                    { text: '1m', value: '1m' },
                    { text: '5m', value: '5m', selected: true },
                    { text: '15m', value: '15m' },
                    { text: '1h', value: '1h' },
                ],
                current: { text: '5m', value: '5m' },
            },
        ],
    },

    annotations: { list: [] },
    links: [],

    panels: [
        {
            id: "1",
            type: 'forecast',
            title: 'CPU Usage Forecast',
            gridPos: { x: 0, y: 0, w: 12, h: 6 },
            targets: [{ refId: 'A', expr: 'sum(rate(node_cpu_seconds_total{mode!="idle"}[5m]))' }],
            options: { forecastHours: 24, threshold: 80 },
            fieldConfig: {
                defaults: { unit: 'percent' },
                overrides: [],
            },
        },
        {
            id: "101",
            type: 'stat',
            title: 'Total Devices',
            gridPos: { x: 0, y: 6, w: 4, h: 4 },
            targets: [{ refId: 'A', expr: 'count(up)' }],
            options: { colorMode: 'value', graphMode: 'area' },
            fieldConfig: {
                defaults: {
                    thresholds: {
                        mode: 'absolute',
                        steps: [
                            { value: 0, color: 'green' },
                            { value: 100, color: 'yellow' },
                        ],
                    },
                },
                overrides: [],
            },
        },
        {
            id: "2",
            type: 'stat',
            title: 'Active Alerts',
            gridPos: { x: 4, y: 0, w: 4, h: 4 },
            targets: [{ refId: 'A', expr: 'count(ALERTS{alertstate="firing"})' }],
            options: { colorMode: 'value', graphMode: 'area' },
            fieldConfig: {
                defaults: {
                    thresholds: {
                        mode: 'absolute',
                        steps: [
                            { value: 0, color: 'green' },
                            { value: 5, color: 'yellow' },
                            { value: 20, color: 'red' },
                        ],
                    },
                },
                overrides: [],
            },
        },
        {
            id: "3",
            type: 'gauge',
            title: 'Uptime',
            gridPos: { x: 8, y: 0, w: 4, h: 4 },
            targets: [{ refId: 'A', expr: '' }],
            options: { showThresholdLabels: true, showThresholdMarkers: true },
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    min: 0,
                    max: 100,
                    thresholds: {
                        mode: 'absolute',
                        steps: [
                            { value: 0, color: 'red' },
                            { value: 90, color: 'yellow' },
                            { value: 99, color: 'green' },
                        ],
                    },
                },
                overrides: [],
            },
        },
        {
            id: "4",
            type: 'gauge',
            title: 'CPU Usage',
            gridPos: { x: 12, y: 0, w: 4, h: 4 },
            targets: [{ refId: 'A', expr: '' }],
            options: {},
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    min: 0,
                    max: 100,
                    thresholds: {
                        mode: 'absolute',
                        steps: [
                            { value: 0, color: 'green' },
                            { value: 70, color: 'yellow' },
                            { value: 90, color: 'red' },
                        ],
                    },
                },
                overrides: [],
            },
        },
        {
            id: "5",
            type: 'stat',
            title: 'Avg Latency',
            gridPos: { x: 16, y: 0, w: 4, h: 4 },
            targets: [{ refId: 'A', expr: '' }],
            options: { colorMode: 'value', graphMode: 'area' },
            fieldConfig: {
                defaults: {
                    unit: 'ms',
                    thresholds: {
                        mode: 'absolute',
                        steps: [
                            { value: 0, color: 'green' },
                            { value: 50, color: 'yellow' },
                            { value: 100, color: 'red' },
                        ],
                    },
                },
                overrides: [],
            },
        },
        {
            id: "6",
            type: 'statusgrid',
            title: 'Node Status',
            gridPos: { x: 20, y: 0, w: 4, h: 4 },
            targets: [{ refId: 'A', expr: '' }],
            options: { columns: 4, showLabels: false },
            fieldConfig: { defaults: {}, overrides: [] },
        },
        {
            id: "7",
            type: 'timeseries',
            title: 'Network Latency',
            gridPos: { x: 0, y: 4, w: 12, h: 8 },
            targets: [
                { refId: 'A', expr: 'probe_duration_seconds', legendFormat: 'Latency' },
            ],
            options: {
                legend: { displayMode: 'list', placement: 'bottom', showLegend: true },
                tooltip: { mode: 'multi' },
            },
            fieldConfig: {
                defaults: {
                    unit: 'ms',
                    color: { mode: 'palette-classic' },
                },
                overrides: [],
            },
        },
        {
            id: "8",
            type: 'timeseries',
            title: 'Traffic Throughput',
            gridPos: { x: 12, y: 4, w: 12, h: 8 },
            targets: [
                { refId: 'A', expr: 'irate(node_network_receive_bytes_total[5m])', legendFormat: 'Inbound' },
                { refId: 'B', expr: 'irate(node_network_transmit_bytes_total[5m])', legendFormat: 'Outbound' },
            ],
            options: {
                legend: { displayMode: 'list', placement: 'bottom', showLegend: true },
                tooltip: { mode: 'multi' },
            },
            fieldConfig: {
                defaults: {
                    unit: 'bytes',
                    color: { mode: 'palette-classic' },
                },
                overrides: [],
            },
        },
        {
            id: "9",
            type: 'barchart',
            title: 'Alerts by Region',
            gridPos: { x: 0, y: 12, w: 8, h: 6 },
            targets: [{ refId: 'A', expr: '' }],
            options: { orientation: 'horizontal' },
            fieldConfig: { defaults: {}, overrides: [] },
        },
        {
            id: "10",
            type: 'table',
            title: 'Device Status',
            gridPos: { x: 8, y: 12, w: 16, h: 6 },
            targets: [{ refId: 'A', expr: '' }],
            options: { showHeader: true, cellHeight: 'sm' },
            fieldConfig: { defaults: {}, overrides: [] },
        },
    ],

    version: 1,
    schemaVersion: 1,
    id: "demo",
    slug: "demo-network-core",
    timeRange: { from: 'now-6h', to: 'now' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    starred: false,
    createdBy: 'admin',
    updatedBy: 'admin',
};

export default DashboardPage;
