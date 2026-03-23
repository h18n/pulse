// Dashboard State Management
import { create } from 'zustand';

// ============== Core Types ==============

export interface TimeRange {
    from: string;  // "now-6h" or ISO date
    to: string;    // "now" or ISO date
}

export interface GridPos {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface DataSourceRef {
    type: string;
    uid: string;
}

export interface DataQuery {
    refId: string;
    expr?: string;
    query?: string;
    legendFormat?: string;
    interval?: string;
    hide?: boolean;
}

export interface ThresholdStep {
    value: number;
    color: string;
}

export interface FieldConfig {
    defaults: {
        unit?: string;
        decimals?: number;
        min?: number;
        max?: number;
        color?: { mode: string; fixedColor?: string };
        thresholds?: {
            mode: 'absolute' | 'percentage';
            steps: ThresholdStep[];
        };
    };
    overrides: unknown[];
}

export interface PanelModel {
    id: number;
    type: string;
    title: string;
    description?: string;
    gridPos: GridPos;
    datasource?: DataSourceRef | null;
    targets: DataQuery[];
    transformations?: unknown[];
    options: Record<string, unknown>;
    fieldConfig: FieldConfig;

    // Time Override
    timeFrom?: string;
    timeShift?: string;
    hideTimeOverride?: boolean;

    // Repeat
    repeat?: string;
    repeatDirection?: 'h' | 'v';
    maxPerRow?: number;

    // Caching
    cacheTimeout?: string;
    queryCachingTTL?: number;
}

export interface VariableOption {
    text: string;
    value: string | string[];
    selected?: boolean;
}

export interface VariableModel {
    name: string;
    type: 'query' | 'custom' | 'textbox' | 'constant' | 'datasource' | 'interval' | 'adhoc';
    label?: string;
    hide: 0 | 1 | 2;  // 0=show, 1=hide label, 2=hide variable
    description?: string;

    // Query-based
    query?: string;
    datasource?: DataSourceRef;
    refresh?: 1 | 2;  // 1=on load, 2=on time change
    regex?: string;
    sort?: number;

    // Options
    options: VariableOption[];
    current: VariableOption;
    multi?: boolean;
    includeAll?: boolean;
    allValue?: string;
}

export interface DashboardLink {
    title: string;
    type: 'link' | 'dashboards';
    url?: string;
    tags?: string[];
    asDropdown?: boolean;
    icon?: string;
    includeVars?: boolean;
    keepTime?: boolean;
    targetBlank?: boolean;
}

export interface AnnotationQuery {
    name: string;
    datasource: DataSourceRef;
    enable: boolean;
    hide?: boolean;
    iconColor?: string;
    query?: string;
}

export interface DashboardModel {
    uid: string;
    title: string;
    description?: string;
    tags: string[];
    timezone: string;
    editable: boolean;

    // Time
    time: TimeRange;
    timepicker: {
        refresh_intervals?: string[];
        time_options?: string[];
        hidden?: boolean;
    };
    refresh?: string;
    liveNow?: boolean;

    // Layout
    panels: PanelModel[];

    // Variables
    templating: { list: VariableModel[] };

    // Annotations
    annotations: { list: AnnotationQuery[] };

    // Links
    links: DashboardLink[];

    // Meta
    version: number;
    schemaVersion: number;
    fiscalYearStartMonth?: number;
}

export interface ChronosMarker {
    id: string;
    timestamp: number;
    label: string;
    type: 'incident' | 'note' | 'fix';
}


// ============== Dashboard State ==============

interface PanelState {
    id: number;
    isLoading: boolean;
    error?: string;
    data?: unknown[];
    lastRefresh: number;
}

interface DashboardState {
    // Core
    dashboard: DashboardModel | null;
    originalDashboard: DashboardModel | null;

    // Runtime
    isEditing: boolean;
    isSaving: boolean;

    // Time (global filter)
    timeRange: TimeRange;
    refreshInterval: string;
    lastRefresh: number;

    // Variables state
    variableValues: Record<string, string | string[]>;

    // Panel states
    panelStates: Record<number, PanelState>;
    panelInEdit: number | null;
    panelInView: number | null;

    // Chronos Scrubber
    scrubbedTime: number | null;
    isScrubbing: boolean;
    markers: ChronosMarker[];


    // Actions
    loadDashboard: (dashboard: DashboardModel) => void;
    setTimeRange: (range: TimeRange) => void;
    setRefreshInterval: (interval: string) => void;
    triggerRefresh: () => void;

    // Panel actions
    addPanel: (type: string) => void;
    updatePanel: (id: number, updates: Partial<PanelModel>) => void;
    deletePanel: (id: number) => void;
    duplicatePanel: (id: number) => void;
    updatePanelGridPos: (id: number, gridPos: GridPos) => void;

    // Edit mode
    enterEditMode: (panelId: number) => void;
    exitEditMode: () => void;
    enterViewMode: (panelId: number) => void;
    exitViewMode: () => void;

    // Variables
    setVariableValue: (name: string, value: string | string[]) => void;

    // Save
    saveDashboard: () => Promise<void>;
    hasChanges: () => boolean;

    // Chronos Actions
    setScrubbedTime: (time: number | null) => void;
    toggleScrubbing: (enabled: boolean) => void;
    addMarker: (marker: Omit<ChronosMarker, 'id'>) => void;
    removeMarker: (id: string) => void;

}

// ============== Default Values ==============

const DEFAULT_FIELD_CONFIG: FieldConfig = {
    defaults: {
        color: { mode: 'palette-classic' },
        thresholds: {
            mode: 'absolute',
            steps: [
                { value: 0, color: 'green' },
            ],
        },
    },
    overrides: [],
};

const DEFAULT_PANEL_OPTIONS: Record<string, Record<string, unknown>> = {
    timeseries: {
        legend: { displayMode: 'list', placement: 'bottom', showLegend: true },
        tooltip: { mode: 'multi', sort: 'none' },
    },
    stat: {
        colorMode: 'value',
        graphMode: 'area',
        justifyMode: 'auto',
        textMode: 'auto',
    },
    gauge: {
        showThresholdLabels: false,
        showThresholdMarkers: true,
    },
    table: {
        showHeader: true,
        cellHeight: 'sm',
    },
    barchart: {
        orientation: 'horizontal',
        showValue: 'auto',
        groupWidth: 0.7,
        barWidth: 0.97,
    },
};

// ============== Quick Time Ranges ==============

export const QUICK_RANGES = [
    { display: 'Last 5 minutes', from: 'now-5m', to: 'now' },
    { display: 'Last 15 minutes', from: 'now-15m', to: 'now' },
    { display: 'Last 30 minutes', from: 'now-30m', to: 'now' },
    { display: 'Last 1 hour', from: 'now-1h', to: 'now' },
    { display: 'Last 3 hours', from: 'now-3h', to: 'now' },
    { display: 'Last 6 hours', from: 'now-6h', to: 'now' },
    { display: 'Last 12 hours', from: 'now-12h', to: 'now' },
    { display: 'Last 24 hours', from: 'now-24h', to: 'now' },
    { display: 'Last 2 days', from: 'now-2d', to: 'now' },
    { display: 'Last 7 days', from: 'now-7d', to: 'now' },
    { display: 'Last 30 days', from: 'now-30d', to: 'now' },
    { display: 'Last 90 days', from: 'now-90d', to: 'now' },
    { display: 'Today', from: 'now/d', to: 'now/d' },
    { display: 'Yesterday', from: 'now-1d/d', to: 'now-1d/d' },
    { display: 'This week', from: 'now/w', to: 'now/w' },
    { display: 'This month', from: 'now/M', to: 'now/M' },
];

export const REFRESH_INTERVALS = [
    { label: 'Off', value: '' },
    { label: '5s', value: '5s' },
    { label: '10s', value: '10s' },
    { label: '30s', value: '30s' },
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '2h', value: '2h' },
    { label: '1d', value: '1d' },
];

// ============== Store ==============

export const useDashboardStore = create<DashboardState>((set, get) => ({
    dashboard: null,
    originalDashboard: null,
    isEditing: false,
    isSaving: false,
    timeRange: { from: 'now-6h', to: 'now' },
    refreshInterval: '',
    lastRefresh: Date.now(),
    variableValues: {},
    panelStates: {},
    panelInEdit: null,
    panelInView: null,
    scrubbedTime: null,
    isScrubbing: false,
    markers: [],


    loadDashboard: (dashboard: DashboardModel) => {
        const variableValues: Record<string, string | string[]> = {};
        dashboard.templating.list.forEach((v) => {
            variableValues[v.name] = v.current.value;
        });

        const panelStates: Record<number, PanelState> = {};
        dashboard.panels.forEach((p) => {
            panelStates[p.id] = {
                id: p.id,
                isLoading: false,
                lastRefresh: 0,
            };
        });

        set({
            dashboard,
            originalDashboard: JSON.parse(JSON.stringify(dashboard)),
            timeRange: dashboard.time,
            refreshInterval: dashboard.refresh || '',
            variableValues,
            panelStates,
        });
    },

    setTimeRange: (range: TimeRange) => set({
        timeRange: range,
        lastRefresh: Date.now(),
    }),

    setRefreshInterval: (interval: string) => set({
        refreshInterval: interval,
    }),

    triggerRefresh: () => set({
        lastRefresh: Date.now(),
    }),

    addPanel: (type: string) => {
        const { dashboard } = get();
        if (!dashboard) return;

        const maxId = Math.max(0, ...dashboard.panels.map((p) => p.id));
        const newId = maxId + 1;

        let y = 0;
        if (dashboard.panels.length > 0) {
            const maxY = Math.max(...dashboard.panels.map((p) => p.gridPos.y + p.gridPos.h));
            y = maxY;
        }

        const newPanel: PanelModel = {
            id: newId,
            type,
            title: 'New Panel',
            gridPos: { x: 0, y, w: 12, h: 8 },
            targets: [{ refId: 'A' }],
            options: DEFAULT_PANEL_OPTIONS[type] || {},
            fieldConfig: { ...DEFAULT_FIELD_CONFIG },
        };

        set({
            dashboard: {
                ...dashboard,
                panels: [...dashboard.panels, newPanel],
            },
            panelStates: {
                ...get().panelStates,
                [newId]: { id: newId, isLoading: false, lastRefresh: 0 },
            },
            panelInEdit: newId,
        });
    },

    updatePanel: (id: number, updates: Partial<PanelModel>) => {
        const { dashboard } = get();
        if (!dashboard) return;

        set({
            dashboard: {
                ...dashboard,
                panels: dashboard.panels.map((p) =>
                    p.id === id ? { ...p, ...updates } : p
                ),
            },
        });
    },

    deletePanel: (id: number) => {
        const { dashboard, panelStates } = get();
        if (!dashboard) return;

        const newPanelStates = { ...panelStates };
        delete newPanelStates[id];

        set({
            dashboard: {
                ...dashboard,
                panels: dashboard.panels.filter((p) => p.id !== id),
            },
            panelStates: newPanelStates,
        });
    },

    duplicatePanel: (id: number) => {
        const { dashboard } = get();
        if (!dashboard) return;

        const panel = dashboard.panels.find((p) => p.id === id);
        if (!panel) return;

        const maxId = Math.max(0, ...dashboard.panels.map((p) => p.id));
        const newId = maxId + 1;

        const newPanel: PanelModel = {
            ...JSON.parse(JSON.stringify(panel)),
            id: newId,
            title: `${panel.title} (copy)`,
            gridPos: {
                ...panel.gridPos,
                y: panel.gridPos.y + panel.gridPos.h,
            },
        };

        set({
            dashboard: {
                ...dashboard,
                panels: [...dashboard.panels, newPanel],
            },
            panelStates: {
                ...get().panelStates,
                [newId]: { id: newId, isLoading: false, lastRefresh: 0 },
            },
        });
    },

    updatePanelGridPos: (id: number, gridPos: GridPos) => {
        const { dashboard } = get();
        if (!dashboard) return;

        set({
            dashboard: {
                ...dashboard,
                panels: dashboard.panels.map((p) =>
                    p.id === id ? { ...p, gridPos } : p
                ),
            },
        });
    },

    enterEditMode: (panelId: number) => set({
        panelInEdit: panelId,
        isEditing: true,
    }),

    exitEditMode: () => set({
        panelInEdit: null,
        isEditing: false,
    }),

    enterViewMode: (panelId: number) => set({
        panelInView: panelId,
    }),

    exitViewMode: () => set({
        panelInView: null,
    }),

    setVariableValue: (name: string, value: string | string[]) => set({
        variableValues: {
            ...get().variableValues,
            [name]: value,
        },
        lastRefresh: Date.now(),
    }),

    saveDashboard: async () => {
        const { dashboard } = get();
        if (!dashboard) return;

        set({ isSaving: true });

        try {
            await fetch('/api/dashboards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dashboard),
            });

            set({
                originalDashboard: JSON.parse(JSON.stringify(dashboard)),
                isSaving: false,
            });
        } catch {
            set({ isSaving: false });
            throw new Error('Failed to save dashboard');
        }
    },

    hasChanges: () => {
        const { dashboard, originalDashboard } = get();
        return JSON.stringify(dashboard) !== JSON.stringify(originalDashboard);
    },

    setScrubbedTime: (time: number | null) => set({
        scrubbedTime: time,
        lastRefresh: Date.now(),
    }),

    toggleScrubbing: (enabled: boolean) => set({
        isScrubbing: enabled,
        scrubbedTime: enabled ? Date.now() : null,
        lastRefresh: Date.now(),
    }),

    addMarker: (marker) => set({
        markers: [...get().markers, { ...marker, id: Math.random().toString(36).substr(2, 9) }]
    }),

    removeMarker: (id) => set({
        markers: get().markers.filter(m => m.id !== id)
    }),
}));


// ============== Selectors ==============

export const selectPanels = (state: DashboardState) => state.dashboard?.panels || [];
export const selectVariables = (state: DashboardState) => state.dashboard?.templating.list || [];
export const selectTimeRange = (state: DashboardState) => state.timeRange;
export const selectRefreshInterval = (state: DashboardState) => state.refreshInterval;
