import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useDashboardStore, selectFilteredDashboards } from './dashboardStore';

describe('Dashboard Store', () => {

    beforeEach(() => {
        useDashboardStore.getState().reset();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should initialize with default state', () => {
        const state = useDashboardStore.getState();
        expect(state.dashboards).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.isEditing).toBe(false);
    });

    it('should set search query', () => {
        useDashboardStore.getState().setSearchQuery('test');
        expect(useDashboardStore.getState().searchQuery).toBe('test');
    });

    it('should fetch dashboards successfully', async () => {
        const mockDashboards = [
            { id: '1', title: 'Dash 1', starred: true, updatedAt: new Date().toISOString() },
            { id: '2', title: 'Dash 2', starred: false, updatedAt: new Date().toISOString() }
        ];

        const mockResponse = {
            ok: true,
            json: async () => ({ dashboards: mockDashboards, folders: [] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await useDashboardStore.getState().fetchDashboards();

        const state = useDashboardStore.getState();
        expect(state.dashboards.length).toBe(2);
        expect(state.starredDashboards.length).toBe(1);
        expect(state.isLoading).toBe(false);
    });

    it('should handle fetch failure', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false });

        await useDashboardStore.getState().fetchDashboards();

        const state = useDashboardStore.getState();
        expect(state.error).toBe('Failed to fetch dashboards');
        expect(state.isLoading).toBe(false);
    });

    it('should fetch single dashboard', async () => {
        const mockDashboard = { id: '1', title: 'My Dash', panels: [] };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockDashboard
        });

        await useDashboardStore.getState().fetchDashboard('1');

        const state = useDashboardStore.getState();
        expect(state.currentDashboard?.title).toBe('My Dash');
        expect(state.originalDashboard?.title).toBe('My Dash');
    });

    it('should manage edit mode and unsaved changes', () => {
        const store = useDashboardStore.getState();

        // Setup a current dashboard
        store.setCurrentDashboard({ id: '1', title: 'Original', panels: [], tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: '' });

        expect(useDashboardStore.getState().isEditing).toBe(false);
        store.setEditMode(true);
        expect(useDashboardStore.getState().isEditing).toBe(true);

        // Add panel should trigger unsaved changes
        store.addPanel({ title: 'New Panel' });
        expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
        expect(useDashboardStore.getState().currentDashboard?.panels.length).toBe(1);

        // Discard changes should reset to original
        store.discardChanges();
        expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
        expect(useDashboardStore.getState().currentDashboard?.panels.length).toBe(0);
        expect(useDashboardStore.getState().isEditing).toBe(false);
    });

    it('should delete a panel', () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({
            id: '1', title: 'Title',
            panels: [{ id: 'p1', title: 'P1', gridPos: { x: 0, y: 0, w: 1, h: 1 }, type: 'stat', targets: [], options: {} }],
            tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: ''
        });

        store.deletePanel('p1');
        expect(useDashboardStore.getState().currentDashboard?.panels.length).toBe(0);
        expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });

    it('should update a panel', () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({
            id: '1', title: 'Title',
            panels: [{ id: 'p1', title: 'P1', gridPos: { x: 0, y: 0, w: 1, h: 1 }, type: 'stat', targets: [], options: {} }],
            tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: ''
        });

        store.updatePanel('p1', { title: 'Updated' });
        expect(useDashboardStore.getState().currentDashboard?.panels[0].title).toBe('Updated');
    });

    it('should toggle scrubbing', () => {
        const store = useDashboardStore.getState();
        expect(store.isScrubbing).toBe(false);
        store.toggleScrubbing(true);
        expect(useDashboardStore.getState().isScrubbing).toBe(true);
        expect(useDashboardStore.getState().scrubbedTime).toBeDefined();
    });

    it('should manage folders', () => {
        const store = useDashboardStore.getState();
        store.createFolder('New Folder');
        expect(useDashboardStore.getState().folders.length).toBe(1);
        expect(useDashboardStore.getState().folders[0].title).toBe('New Folder');

        const folderId = useDashboardStore.getState().folders[0].id;
        store.renameFolder(folderId, 'Renamed');
        expect(useDashboardStore.getState().folders[0].title).toBe('Renamed');

        store.deleteFolder(folderId);
        expect(useDashboardStore.getState().folders.length).toBe(0);
    });

    it('should filter dashboards via selector', () => {
        const state = useDashboardStore.getState();
        state.dashboards = [
            { id: '1', title: 'Alpha', tags: ['web'], updatedAt: '2023-01-02', createdAt: '2023-01-01', starred: false },
            { id: '2', title: 'Beta', tags: ['db'], updatedAt: '2023-01-01', createdAt: '2023-01-02', starred: false }
        ];

        // Default sort (updated)
        let filtered = selectFilteredDashboards(useDashboardStore.getState());
        expect(filtered[0].title).toBe('Alpha'); // Alpha is newer in updatedAt

        // Search filter
        useDashboardStore.getState().setSearchQuery('beta');
        filtered = selectFilteredDashboards(useDashboardStore.getState());
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe('Beta');

        // Reset and sort by name
        useDashboardStore.getState().setSearchQuery('');
        useDashboardStore.getState().setSortBy('name');
        filtered = selectFilteredDashboards(useDashboardStore.getState());
        expect(filtered[0].title).toBe('Alpha');

        // Sort by created
        useDashboardStore.getState().setSortBy('created');
        filtered = selectFilteredDashboards(useDashboardStore.getState());
        expect(filtered[0].title).toBe('Beta'); // Beta created is 01-02
    });

    it('should create a dashboard', async () => {
        const mockDashboard = { id: '3', title: 'New' };
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => mockDashboard }) // create
            .mockResolvedValueOnce({ ok: true, json: async () => ({ dashboards: [], folders: [] }) }); // re-fetch

        const res = await useDashboardStore.getState().createDashboard({ title: 'New' });
        expect(res.id).toBe('3');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should update a dashboard', async () => {
        const mockDashboard = { id: '1', title: 'Updated' };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockDashboard
        });

        await useDashboardStore.getState().updateDashboard('1', { title: 'Updated' });
        expect(useDashboardStore.getState().currentDashboard?.title).toBe('Updated');
        expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should delete a dashboard', async () => {
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true }) // delete
            .mockResolvedValueOnce({ ok: true, json: async () => ({ dashboards: [], folders: [] }) }); // re-fetch

        await useDashboardStore.getState().deleteDashboard('1');
        expect(useDashboardStore.getState().currentDashboard).toBe(null);
    });

    it('should duplicate a dashboard', async () => {
        const mockDashboard = { id: 'dup', title: 'Copy' };
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => mockDashboard }) // duplicate
            .mockResolvedValueOnce({ ok: true, json: async () => ({ dashboards: [], folders: [] }) }); // re-fetch

        const res = await useDashboardStore.getState().duplicateDashboard('1', 'Copy');
        expect(res.id).toBe('dup');
    });

    it('should toggle star state', async () => {
        const store = useDashboardStore.getState();
        store.dashboards = [{ id: '1', title: 'D1', starred: false, tags: [], updatedAt: '', createdAt: '' }];
        (global.fetch as any).mockResolvedValue({ ok: true });

        await store.toggleStar('1');
        expect(useDashboardStore.getState().dashboards[0].starred).toBe(true);
        expect(useDashboardStore.getState().starredDashboards.length).toBe(1);

        await store.toggleStar('1');
        expect(useDashboardStore.getState().dashboards[0].starred).toBe(false);
        expect(useDashboardStore.getState().starredDashboards.length).toBe(0);
    });

    it('should handle saveDashboard', async () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({ id: '1', title: 'T', panels: [], tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: '' });
        store.setEditMode(true);

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ id: '1', title: 'T', panels: [] })
        });

        await store.saveDashboard();
        expect(useDashboardStore.getState().isEditing).toBe(false);
    });
    it('should move a panel', () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({
            id: '1', title: 'T',
            panels: [{ id: 'p1', title: 'P1', gridPos: { x: 0, y: 0, w: 1, h: 1 }, type: 'stat', targets: [], options: {} }],
            tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: ''
        });

        store.movePanel('p1', { x: 2, y: 2, w: 1, h: 1 });
        expect(useDashboardStore.getState().currentDashboard?.panels[0].gridPos.x).toBe(2);
    });

    it('should resize a panel', () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({
            id: '1', title: 'T',
            panels: [{ id: 'p1', title: 'P1', gridPos: { x: 0, y: 0, w: 1, h: 1 }, type: 'stat', targets: [], options: {} }],
            tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: ''
        });

        store.resizePanel('p1', 8, 8);
        expect(useDashboardStore.getState().currentDashboard?.panels[0].gridPos.w).toBe(8);
    });

    it('should reorder panels', () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({
            id: '1', title: 'T',
            panels: [
                { id: 'p1', title: 'P1', gridPos: { x: 0, y: 0, w: 1, h: 1 }, type: 'stat', targets: [], options: {} },
                { id: 'p2', title: 'P2', gridPos: { x: 1, y: 1, w: 1, h: 1 }, type: 'stat', targets: [], options: {} }
            ],
            tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: ''
        });

        store.reorderPanels(0, 1);
        expect(useDashboardStore.getState().currentDashboard?.panels[0].id).toBe('p2');
    });

    it('should duplicate a panel', () => {
        const store = useDashboardStore.getState();
        store.setCurrentDashboard({
            id: '1', title: 'T',
            panels: [{ id: 'p1', title: 'P1', gridPos: { x: 0, y: 0, w: 1, h: 1 }, type: 'stat', targets: [], options: {} }],
            tags: [], createdAt: '', updatedAt: '', timeRange: { from: '', to: '' }, refreshInterval: ''
        });

        store.duplicatePanel('p1');
        expect(useDashboardStore.getState().currentDashboard?.panels.length).toBe(2);
    });

    it('should toggle edit/view modes', () => {
        const store = useDashboardStore.getState();
        store.enterEditMode('p1');
        expect(useDashboardStore.getState().isEditing).toBe(true);
        store.exitEditMode();
        expect(useDashboardStore.getState().isEditing).toBe(false);

        store.enterViewMode('p1');
        expect(useDashboardStore.getState().panelInView).toBe('p1');
        store.exitViewMode();
        expect(useDashboardStore.getState().panelInView).toBe(null);
    });

    it('should manage markers and refresh', () => {
        const store = useDashboardStore.getState();
        store.addMarker({ text: 'Error' });
        expect(useDashboardStore.getState().markers.length).toBe(1);

        const before = useDashboardStore.getState().lastRefresh;
        store.triggerRefresh();
        expect(useDashboardStore.getState().lastRefresh).not.toBe(before);
    });

    it('should handle setVariableValue', () => {
        const store = useDashboardStore.getState();
        store.setVariableValue('host', 'localhost');
        expect(useDashboardStore.getState().variableValues['host']).toBe('localhost');
    });

    it('should set scrubbed time', () => {
        useDashboardStore.getState().setScrubbedTime(12345);
        expect(useDashboardStore.getState().scrubbedTime).toBe(12345);
    });

    it('should call mock permission updates', async () => {
        const store = useDashboardStore.getState();
        // Just calling them for coverage since they are console.log mocks
        await store.updateUserPermission('d1', 'u1', 'admin');
        await store.removeUserPermission('d1', 'u1');
        await store.addUserPermission('d1', 'e@e.com', 'view');
        await store.updateSharingSettings('d1', {});
        const settings = await store.getSharingSettings('d1');
        expect(settings?.dashboardId).toBe('d1');
    });

    it('should filter by folder in selector', () => {
        const state = useDashboardStore.getState();
        state.dashboards = [
            { id: '1', title: 'Folder 1 Dash', folderId: 'f1', tags: [], updatedAt: '2023-01-01', createdAt: '2023-01-01', starred: false },
            { id: '2', title: 'Root Dash', folderId: undefined, tags: [], updatedAt: '2023-01-01', createdAt: '2023-01-01', starred: false }
        ];

        useDashboardStore.getState().setSelectedFolder('f1');
        const filtered = selectFilteredDashboards(useDashboardStore.getState());
        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe('1');
    });

    it('should sort by name in selector', () => {
        const state = useDashboardStore.getState();
        state.dashboards = [
            { id: '1', title: 'Beta', tags: [], updatedAt: '2023-01-01', createdAt: '2023-01-01', starred: false },
            { id: '2', title: 'Alpha', tags: [], updatedAt: '2023-01-01', createdAt: '2023-01-01', starred: false }
        ];

        useDashboardStore.getState().setSortBy('name');
        const filtered = selectFilteredDashboards(useDashboardStore.getState());
        expect(filtered[0].title).toBe('Alpha');
    });
});

