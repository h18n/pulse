// Dashboard Types

export type PanelType =
    | 'stat'
    | 'timeseries'
    | 'table'
    | 'barchart'
    | 'gauge'
    | 'text'
    | 'piechart'
    | 'heatmap'
    | 'forecast'
    | 'statusgrid';

export interface GridPos {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface QueryTarget {
    expr: string;
    query?: string;
    legendFormat?: string;
    refId?: string;
}

export interface Threshold {
    value: number;
    color: string;
    label?: string;
}

export interface DataSourceRef {
    type: string;
    uid: string;
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

export interface Panel {
    id: string;
    type: PanelType;
    title: string;
    description?: string;
    gridPos: GridPos;
    datasource?: DataSourceRef | string | null;
    targets: QueryTarget[];
    options: Record<string, unknown>;
    fieldConfig?: FieldConfig;
    thresholds?: Threshold[];
}

export interface TimeRange {
    from: string;
    to: string;
}

export interface Dashboard {
    id: string;
    uid: string;
    title: string;
    description?: string;
    slug: string;
    folderId?: string;
    tags: string[];
    panels: Panel[];
    templating?: { list: any[] };
    timezone?: string;
    editable?: boolean;
    time?: TimeRange;
    timepicker?: { refresh_intervals: string[] };
    refresh?: string;
    links?: any[];
    annotations?: { list: any[] };
    schemaVersion?: number;
    style?: string;
    graphTooltip?: number;
    timeRange: TimeRange;
    refreshInterval?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    starred?: boolean;
}

export interface Folder {
    id: string;
    uid: string;
    title: string;
    parentId?: string;
    dashboardCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardListItem {
    id: string;
    uid: string;
    title: string;
    description?: string;
    folderId?: string;
    folderTitle?: string;
    tags: string[];
    panelCount: number;
    starred: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: {
        id: string;
        name: string;
    };
}

export interface CreateDashboardRequest {
    title: string;
    description?: string;
    folderId?: string;
    tags?: string[];
    panels?: Panel[];
}

export interface UpdateDashboardRequest {
    title?: string;
    description?: string;
    folderId?: string;
    tags?: string[];
    panels?: Panel[];
    timeRange?: TimeRange;
    refreshInterval?: string;
}

// Panel editor types
export interface PanelEditorState {
    panel: Panel | null;
    isNew: boolean;
}

// Sharing and permissions
export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface UserPermission {
    userId: string;
    email: string;
    name: string;
    avatar?: string;
    permission: PermissionLevel;
    addedAt: string;
    addedBy: string;
}

export interface SharingSettings {
    dashboardId: string;
    visibility: 'private' | 'organization' | 'public';
    linkSharing: boolean;
    shareLink?: string;
    permissions: UserPermission[];
    defaultPermission: PermissionLevel;
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
    hide: 0 | 1 | 2; // 0=show, 1=hide label, 2=hide variable
    description?: string;
    query?: string;
    datasource?: DataSourceRef;
    refresh?: 1 | 2; // 1=on load, 2=on time change
    regex?: string;
    sort?: number;
    options: VariableOption[];
    current: VariableOption;
    multi?: boolean;
    includeAll?: boolean;
    allValue?: string;
}
