import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    Dashboard,
    DashboardListItem,
    Folder,
    Panel,
    GridPos,
    CreateDashboardRequest,
    UpdateDashboardRequest,
    SharingSettings,
    PermissionLevel,
} from '@/types/dashboard';

export type {
    Dashboard,
    DashboardListItem,
    Folder,
    Panel,
    GridPos,
    VariableModel,
    TimeRange,
} from '@/types/dashboard';

interface DashboardState {
    // List view state
    dashboards: DashboardListItem[];
    folders: Folder[];
    starredDashboards: DashboardListItem[];
    recentDashboards: DashboardListItem[];
    isLoading: boolean;
    error: string | null;

    // Current dashboard state
    currentDashboard: Dashboard | null;
    originalDashboard: Dashboard | null;

    // Edit mode state
    isEditing: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;

    // Panel editing
    editingPanelId: string | null;

    // Search & filter
    searchQuery: string;
    selectedFolder: string | null;
    sortBy: 'name' | 'updated' | 'created';

    // Chronos Scrubber
    scrubbedTime: number | null;
    isScrubbing: boolean;
    markers: any[];
    lastRefresh: number;
    timeRange: { from: string; to: string };
    variableValues: Record<string, string | string[]>;
    panelStates: Record<string, any>;
    panelInView: string | null;
    refreshInterval: string;




    // Actions - List
    fetchDashboards: () => Promise<void>;
    fetchDashboard: (id: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setSelectedFolder: (folderId: string | null) => void;
    setSortBy: (sort: 'name' | 'updated' | 'created') => void;

    // Actions - CRUD
    createDashboard: (data: CreateDashboardRequest) => Promise<Dashboard>;
    updateDashboard: (id: string, data: UpdateDashboardRequest) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    duplicateDashboard: (id: string, title: string) => Promise<Dashboard>;

    // Actions - Edit mode
    setEditMode: (editing: boolean) => void;
    loadDashboard: (dashboard: any) => void;
    setTimeRange: (range: { from: string; to: string }) => void;
    setVariableValue: (name: string, value: string | string[]) => void;
    triggerRefresh: () => void;
    hasChanges: () => boolean;


    discardChanges: () => void;
    saveDashboard: () => Promise<void>;

    // Actions - Panel operations
    addPanel: (panel: Partial<Panel>) => void;
    updatePanel: (panelId: string, updates: Partial<Panel>) => void;

    // Actions - Chronos
    setScrubbedTime: (time: number | null) => void;
    toggleScrubbing: (enabled: boolean) => void;
    addMarker: (marker: any) => void;

    deletePanel: (panelId: string) => void;
    movePanel: (panelId: string, gridPos: GridPos) => void;
    updatePanelGridPos: (panelId: string, gridPos: GridPos) => void;
    resizePanel: (panelId: string, width: number, height: number) => void;
    reorderPanels: (fromIndex: number, toIndex: number) => void;
    setEditingPanel: (panelId: string | null) => void;
    duplicatePanel: (panelId: string) => void;

    enterEditMode: (panelId: string) => void;
    exitEditMode: () => void;
    enterViewMode: (panelId: string) => void;
    exitViewMode: () => void;

    // Actions - Starring
    toggleStar: (id: string) => Promise<void>;

    // Actions - Folders
    createFolder: (title: string, parentId?: string) => void;
    renameFolder: (folderId: string, title: string) => void;
    deleteFolder: (folderId: string) => void;

    // Actions - Sharing
    getSharingSettings: (dashboardId: string) => Promise<SharingSettings | null>;
    updateSharingSettings: (dashboardId: string, settings: Partial<SharingSettings>) => Promise<void>;
    addUserPermission: (dashboardId: string, email: string, permission: PermissionLevel) => Promise<void>;
    removeUserPermission: (dashboardId: string, userId: string) => Promise<void>;
    updateUserPermission: (dashboardId: string, userId: string, permission: PermissionLevel) => Promise<void>;

    // Actions - Utility
    setCurrentDashboard: (dashboard: Dashboard | null) => void;
    updateCurrentDashboard: (updates: Partial<Dashboard>) => void;
    setRefreshInterval: (interval: string) => void;
    reset: () => void;
}

const initialState = {
    dashboards: [],
    folders: [],
    starredDashboards: [],
    recentDashboards: [],
    isLoading: false,
    error: null,
    currentDashboard: null,
    originalDashboard: null,
    isEditing: false,
    isSaving: false,
    hasUnsavedChanges: false,
    editingPanelId: null,
    searchQuery: '',
    selectedFolder: null,
    sortBy: 'updated' as const,
    scrubbedTime: null,
    isScrubbing: false,
    markers: [],
    lastRefresh: Date.now(),
    timeRange: { from: 'now-1h', to: 'now' },
    variableValues: {},
    panelStates: {},
    panelInView: null,
    refreshInterval: 'off',
};




export const useDashboardStore = create<DashboardState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // Fetch all dashboards
            fetchDashboards: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/dashboards');
                    if (!response.ok) throw new Error('Failed to fetch dashboards');
                    const data = await response.json();

                    set({
                        dashboards: data.dashboards,
                        starredDashboards: data.dashboards.filter((d: DashboardListItem) => d.starred),
                        recentDashboards: data.dashboards.slice(0, 8),
                        folders: data.folders || [],
                        isLoading: false
                    });
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false });
                }
            },

            // Fetch single dashboard
            fetchDashboard: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dashboards/${id}`);
                    if (!response.ok) throw new Error('Failed to fetch dashboard');
                    const dashboard = await response.json();

                    set({
                        currentDashboard: dashboard,
                        originalDashboard: JSON.parse(JSON.stringify(dashboard)),
                        isLoading: false,
                        hasUnsavedChanges: false
                    });
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false });
                }
            },

            // Search & filter
            setSearchQuery: (query) => set({ searchQuery: query }),
            setSelectedFolder: (folderId) => set({ selectedFolder: folderId }),
            setSortBy: (sort) => set({ sortBy: sort }),

            // Create dashboard
            createDashboard: async (data) => {
                const response = await fetch('/api/dashboards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create dashboard');
                const dashboard = await response.json();

                // Update list
                await get().fetchDashboards();

                return dashboard;
            },

            // Update dashboard
            updateDashboard: async (id, data) => {
                const response = await fetch(`/api/dashboards/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to update dashboard');

                const updated = await response.json();
                set({
                    currentDashboard: updated,
                    originalDashboard: JSON.parse(JSON.stringify(updated)),
                    hasUnsavedChanges: false
                });
            },

            // Delete dashboard
            deleteDashboard: async (id) => {
                const response = await fetch(`/api/dashboards/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete dashboard');

                set({ currentDashboard: null, originalDashboard: null });
                await get().fetchDashboards();
            },

            // Duplicate dashboard
            duplicateDashboard: async (id, title) => {
                const response = await fetch(`/api/dashboards/${id}/duplicate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title }),
                });
                if (!response.ok) throw new Error('Failed to duplicate dashboard');

                const dashboard = await response.json();
                await get().fetchDashboards();
                return dashboard;
            },

            // Edit mode
            setEditMode: (editing) => set({ isEditing: editing }),

            discardChanges: () => {
                const { originalDashboard } = get();
                set({
                    currentDashboard: originalDashboard ? JSON.parse(JSON.stringify(originalDashboard)) : null,
                    hasUnsavedChanges: false,
                    isEditing: false,
                    editingPanelId: null
                });
            },

            saveDashboard: async () => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                set({ isSaving: true });
                try {
                    await get().updateDashboard(currentDashboard.id, {
                        title: currentDashboard.title,
                        description: currentDashboard.description,
                        panels: currentDashboard.panels,
                        tags: currentDashboard.tags,
                        timeRange: currentDashboard.timeRange,
                        refreshInterval: currentDashboard.refreshInterval,
                    });
                } finally {
                    set({ isEditing: false, editingPanelId: null, isSaving: false });
                }
            },

            loadDashboard: (dashboard: any) => {
                get().setCurrentDashboard(dashboard);
            },

            // Panel operations
            addPanel: (panel) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                const newPanel: Panel = {
                    id: `panel_${Date.now()}`,
                    type: panel.type || 'stat',
                    title: panel.title || 'New Panel',
                    description: panel.description,
                    gridPos: panel.gridPos || { x: 0, y: 0, w: 6, h: 4 },
                    targets: panel.targets || [],
                    options: panel.options || {},
                    thresholds: panel.thresholds,
                };

                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels: [...currentDashboard.panels, newPanel],
                    },
                    hasUnsavedChanges: true,
                    editingPanelId: newPanel.id,
                });
            },

            updatePanel: (panelId, updates) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels: currentDashboard.panels.map((p) =>
                            p.id === panelId ? { ...p, ...updates } : p
                        ),
                    },
                    hasUnsavedChanges: true,
                });
            },

            deletePanel: (panelId) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels: currentDashboard.panels.filter((p) => p.id !== panelId),
                    },
                    hasUnsavedChanges: true,
                    editingPanelId: null,
                });
            },

            movePanel: (panelId, gridPos) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels: currentDashboard.panels.map((p) =>
                            p.id === panelId ? { ...p, gridPos } : p
                        ),
                    },
                    hasUnsavedChanges: true,
                });
            },

            updatePanelGridPos: (panelId, gridPos) => {
                get().movePanel(panelId, gridPos);
            },

            resizePanel: (panelId, width, height) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels: currentDashboard.panels.map((p) =>
                            p.id === panelId
                                ? { ...p, gridPos: { ...p.gridPos, w: width, h: height } }
                                : p
                        ),
                    },
                    hasUnsavedChanges: true,
                });
            },

            reorderPanels: (fromIndex, toIndex) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;

                const panels = [...currentDashboard.panels];
                const [movedPanel] = panels.splice(fromIndex, 1);
                panels.splice(toIndex, 0, movedPanel);

                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels,
                    },
                    hasUnsavedChanges: true,
                });
            },

            setEditingPanel: (panelId) => set({ editingPanelId: panelId }),

            duplicatePanel: (panelId) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;
                const panel = currentDashboard.panels.find(p => p.id === panelId);
                if (!panel) return;
                const newPanel = { ...JSON.parse(JSON.stringify(panel)), id: `panel_copy_${Date.now()}` };
                set({
                    currentDashboard: {
                        ...currentDashboard,
                        panels: [...currentDashboard.panels, newPanel],
                    },
                    hasUnsavedChanges: true,
                });
            },

            enterEditMode: (panelId) => set({ editingPanelId: panelId, isEditing: true }),
            exitEditMode: () => set({ editingPanelId: null, isEditing: false }),
            enterViewMode: (panelId) => set({ panelInView: panelId }),
            exitViewMode: () => set({ panelInView: null }),

            // Starring
            toggleStar: async (id) => {
                const { dashboards } = get();
                const dashboard = dashboards.find((d) => d.id === id);
                if (!dashboard) return;

                const method = dashboard.starred ? 'DELETE' : 'POST';
                await fetch(`/api/dashboards/${id}/star`, { method });

                // Optimistic update
                set({
                    dashboards: dashboards.map((d) =>
                        d.id === id ? { ...d, starred: !d.starred } : d
                    ),
                    starredDashboards: dashboard.starred
                        ? get().starredDashboards.filter((d) => d.id !== id)
                        : [...get().starredDashboards, { ...dashboard, starred: true }],
                });
            },

            // Utility
            setCurrentDashboard: (dashboard) => set({
                currentDashboard: dashboard,
                originalDashboard: dashboard ? JSON.parse(JSON.stringify(dashboard)) : null,
                hasUnsavedChanges: false
            }),

            updateCurrentDashboard: (updates) => {
                const { currentDashboard } = get();
                if (!currentDashboard) return;
                set({
                    currentDashboard: { ...currentDashboard, ...updates },
                    hasUnsavedChanges: true,
                });
            },
            setRefreshInterval: (interval) => set({ refreshInterval: interval }),

            // Folder management
            createFolder: (title, parentId) => {
                const newFolder = {
                    id: `folder_${Date.now()}`,
                    uid: `folder_${Date.now()}`,
                    title,
                    parentId,
                    dashboardCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set({ folders: [...get().folders, newFolder] });
            },

            renameFolder: (folderId, title) => {
                set({
                    folders: get().folders.map((f) =>
                        f.id === folderId
                            ? { ...f, title, updatedAt: new Date().toISOString() }
                            : f
                    ),
                });
            },

            deleteFolder: (folderId) => {
                // Move dashboards from deleted folder to root
                set({
                    folders: get().folders.filter((f) => f.id !== folderId),
                    dashboards: get().dashboards.map((d) =>
                        d.folderId === folderId ? { ...d, folderId: undefined } : d
                    ),
                    selectedFolder: get().selectedFolder === folderId ? null : get().selectedFolder,
                });
            },

            // Sharing actions (mock implementations)
            getSharingSettings: async (dashboardId) => {
                // Mock: In production, fetch from API
                return {
                    dashboardId,
                    visibility: 'private' as const,
                    linkSharing: false,
                    permissions: [],
                    defaultPermission: 'view' as const,
                };
            },

            updateSharingSettings: async (dashboardId, settings) => {
                // Mock: In production, update via API
                console.log('Updating sharing settings:', dashboardId, settings);
            },

            addUserPermission: async (dashboardId, email, permission) => {
                // Mock: In production, send invite via API
                console.log('Adding permission:', dashboardId, email, permission);
            },

            removeUserPermission: async (dashboardId, userId) => {
                // Mock: In production, remove via API
                console.log('Removing permission:', dashboardId, userId);
            },

            updateUserPermission: async (dashboardId, userId, permission) => {
                // Mock: In production, update via API
                console.log('Updating permission:', dashboardId, userId, permission);
            },

            // Chronos Actions
            setScrubbedTime: (time) => set({
                scrubbedTime: time,
            }),

            toggleScrubbing: (enabled) => set({
                isScrubbing: enabled,
                scrubbedTime: enabled ? Date.now() : null,
            }),

            addMarker: (marker) => set((state: any) => ({
                markers: [...state.markers, { ...marker, id: Math.random().toString(36).substr(2, 9) }]
            })),

            triggerRefresh: () => set({ lastRefresh: Date.now() }),

            setTimeRange: (range) => set({ timeRange: range, lastRefresh: Date.now() }),

            setVariableValue: (name, value) => {
                set((state) => ({
                    variableValues: { ...state.variableValues, [name]: value },
                    lastRefresh: Date.now()
                }));
            },

            hasChanges: () => get().hasUnsavedChanges,

            reset: () => set(initialState),
        }),
        { name: 'dashboard-store' }
    )
);

// Selectors
export const selectFilteredDashboards = (state: DashboardState) => {
    let filtered = [...state.dashboards];

    // Filter by search
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(
            (d) =>
                d.title.toLowerCase().includes(query) ||
                d.tags.some((t) => t.toLowerCase().includes(query)) ||
                d.description?.toLowerCase().includes(query)
        );
    }

    // Filter by folder
    if (state.selectedFolder) {
        filtered = filtered.filter((d) => d.folderId === state.selectedFolder);
    }

    // Sort
    switch (state.sortBy) {
        case 'name':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'created':
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        case 'updated':
        default:
            filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return filtered;
};

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
];

export const REFRESH_INTERVALS = [
    { label: 'Off', value: '' },
    { label: '5s', value: '5s' },
    { label: '10s', value: '10s' },
    { label: '30s', value: '30s' },
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
];
