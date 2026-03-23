'use client';

import { useEffect, useState, createElement } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Star,
    RefreshCw,
    Clock,
    Settings,
    Pencil,
    Plus,
    Save,
    X,
    Trash2,
    ChevronDown,
    GripVertical,
    History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ChronosScrubber } from '@/features/dashboard/components/ChronosScrubber';

import { DashboardSettingsModal, UnsavedChangesModal } from '@/components/dashboard/DashboardModals';
import { ResizablePanel } from '@/components/dashboard/ResizablePanel';
import { QueryBuilder } from '@/components/dashboard/QueryBuilder';
import { getWidgetComponent } from '@/features/dashboard/widgets/registry';
import type { Panel, PanelType, Dashboard, TimeRange } from '@/types/dashboard';

// Panel type icons
const panelTypeIcons: Record<PanelType, string> = {
    stat: '📊',
    timeseries: '📈',
    table: '📋',
    barchart: '📉',
    gauge: '⏱️',
    text: '📝',
    piechart: '🥧',
    heatmap: '🔥',
    forecast: '🔮',
    statusgrid: '⬛',
};

// Time range options
const timeRanges = [
    { label: 'Last 15 minutes', value: 'now-15m' },
    { label: 'Last 1 hour', value: 'now-1h' },
    { label: 'Last 6 hours', value: 'now-6h' },
    { label: 'Last 24 hours', value: 'now-24h' },
    { label: 'Last 7 days', value: 'now-7d' },
];

// Panel content component
function PanelContent({ panel, isEditing, onEdit, onDelete, timeRange, lastRefresh }: {
    panel: Panel;
    isEditing: boolean;
    onEdit: () => void;
    onDelete: () => void;
    timeRange: TimeRange;
    lastRefresh: number;
}) {
    const widgetComponent = getWidgetComponent(panel.type);

    return (
        <div
            className={cn(
                "relative h-full bg-card border rounded-xl overflow-hidden group transition-all duration-200",
                isEditing
                    ? "border-primary/40 shadow-lg shadow-primary/5"
                    : "border-border/30 hover:border-border/60 shadow-sm"
            )}
            data-testid="dashboard-panel"
        >
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
                <h4 className="text-sm font-medium truncate">{panel.title}</h4>
                <div className="flex items-center gap-1">
                    {isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                className="p-1 hover:bg-muted rounded"
                                onClick={onEdit}
                                data-testid="panel-edit-btn"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                className="p-1 hover:bg-destructive/20 text-destructive rounded"
                                onClick={onDelete}
                                data-testid="panel-delete-btn"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel content */}
            <div className="h-[calc(100%-40px)] w-full overflow-hidden">
                {widgetComponent ? (
                    createElement(widgetComponent as any, {
                        panel: panel,
                        timeRange: timeRange,
                        variables: {},
                        width: panel.gridPos.w,
                        height: panel.gridPos.h,
                        lastRefresh: lastRefresh
                    })
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                        <span className="text-4xl">{panelTypeIcons[panel.type]}</span>
                        <span className="text-xs">Widget not found: {panel.type}</span>
                    </div>
                )}
            </div>

            {/* Drag handle overlay */}
            {isEditing && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-card/80 rounded-full text-xs pointer-events-auto cursor-move border border-border">
                        <GripVertical size={12} />
                        Drag to move
                    </div>
                </div>
            )}
        </div>
    );
}

// Panel Editor Slide-out
function PanelEditor({
    panel,
    isOpen,
    onClose,
    onSave
}: {
    panel: Panel | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (panel: Panel) => void;
}) {
    const [title, setTitle] = useState(panel?.title || '');
    const [type, setType] = useState<PanelType>(panel?.type || 'stat');
    const [query, setQuery] = useState(panel?.targets[0]?.expr || '');

    useEffect(() => {
        if (panel) {
            setTitle(panel.title);
            setType(panel.type);
            setQuery(panel.targets[0]?.expr || '');
        }
    }, [panel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border shadow-2xl z-50"
            data-testid="panel-editor"
        >
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                <h2 className="font-semibold">{panel ? 'Edit Panel' : 'Add Panel'}</h2>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ height: 'calc(100% - 128px)' }}>
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none"
                        placeholder="Panel Title"
                        data-testid="panel-title-input"
                    />
                </div>

                {/* Visualization Type */}
                <div>
                    <label className="block text-sm font-medium mb-2">Visualization</label>
                    <div className="grid grid-cols-4 gap-2">
                        {(Object.keys(panelTypeIcons) as PanelType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors",
                                    type === t
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <span className="text-xl">{panelTypeIcons[t]}</span>
                                <span className="text-xs capitalize">{t}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Query Builder */}
                <div>
                    <label className="block text-sm font-medium mb-2">Query</label>
                    <QueryBuilder
                        value={query}
                        onChange={setQuery}
                    />
                </div>

                {/* Preview */}
                <div>
                    <label className="block text-sm font-medium mb-2">Preview</label>
                    <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-4xl">{panelTypeIcons[type]}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="h-16 px-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        if (panel) {
                            onSave({
                                ...panel,
                                title,
                                type,
                                targets: [{ expr: query }],
                            });
                        }
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    data-testid="panel-apply-btn"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

// Add Panel Button
function AddPanelButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            data-testid="add-panel-btn"
        >
            <Plus size={18} />
            Add visualization
        </button>
    );
}

export default function DashboardViewPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const dashboardId = params.id as string;
    const isEditMode = searchParams.get('edit') === 'true';

    const {
        currentDashboard,
        isLoading,
        error,
        isEditing,
        hasUnsavedChanges,
        editingPanelId,
        fetchDashboard,
        setEditMode,
        saveDashboard,
        discardChanges,
        addPanel,
        updatePanel,
        deletePanel,
        setEditingPanel,
        updateCurrentDashboard,
        deleteDashboard,
        reorderPanels,
        resizePanel,
        isScrubbing,
        toggleScrubbing
    } = useDashboardStore();


    const [showSettings, setShowSettings] = useState(false);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [showTimeRange, setShowTimeRange] = useState(false);

    // Drag and drop state
    const [draggedPanelIndex, setDraggedPanelIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchDashboard(dashboardId);
    }, [dashboardId, fetchDashboard]);

    useEffect(() => {
        setEditMode(isEditMode);
    }, [isEditMode, setEditMode]);

    const handleBack = () => {
        if (hasUnsavedChanges) {
            setPendingNavigation('/dashboards');
            setShowUnsavedModal(true);
        } else {
            router.push('/dashboards');
        }
    };

    const handleUnsavedDiscard = () => {
        discardChanges();
        setShowUnsavedModal(false);
        if (pendingNavigation) {
            router.push(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleUnsavedSave = async () => {
        await saveDashboard();
        setShowUnsavedModal(false);
        if (pendingNavigation) {
            router.push(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleDeleteDashboard = async () => {
        await deleteDashboard(dashboardId);
        router.push('/dashboards');
    };

    const handleUpdateSettings = (updates: Partial<Dashboard>) => {
        updateCurrentDashboard(updates);
    };

    const handleSave = async () => {
        await saveDashboard();
        router.replace(`/dashboards/${dashboardId}`);
    };

    const handleDiscard = () => {
        discardChanges();
        router.replace(`/dashboards/${dashboardId}`);
    };

    const handleToggleEdit = () => {
        if (isEditing) {
            router.replace(`/dashboards/${dashboardId}`);
        } else {
            router.replace(`/dashboards/${dashboardId}?edit=true`);
        }
    };

    const handleAddPanel = (type: PanelType) => {
        addPanel({
            type,
            title: 'New Panel',
            gridPos: { x: 0, y: 100, w: 6, h: 4 }
        });
        setShowAddPanel(false);
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => (e: React.DragEvent) => {
        setDraggedPanelIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (index: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedPanelIndex !== null && draggedPanelIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (index: number) => (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedPanelIndex !== null && draggedPanelIndex !== index) {
            reorderPanels(draggedPanelIndex, index);
        }
        setDraggedPanelIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedPanelIndex(null);
        setDragOverIndex(null);
    };

    const editingPanel = currentDashboard?.panels.find(p => p.id === editingPanelId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !currentDashboard) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-xl font-bold mb-2">Dashboard not found</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button
                    onClick={() => router.push('/dashboards')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                    Back to Dashboards
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Toolbar */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
                {/* Left section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold">{currentDashboard.title}</h1>
                        {hasUnsavedChanges && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full" data-testid="unsaved-indicator" title="Unsaved changes" />
                        )}
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                data-testid="dashboard-settings-btn"
                            >
                                <Settings size={18} />
                            </button>
                            <button
                                onClick={handleDiscard}
                                className="px-4 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                                data-testid="discard-btn"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                data-testid="save-dashboard-btn"
                            >
                                <Save size={16} />
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <Star size={18} className={currentDashboard.starred ? 'text-yellow-500 fill-current' : ''} />
                            </button>
                            <button
                                onClick={() => toggleScrubbing(!isScrubbing)}
                                className={cn(
                                    "p-1.5 rounded-md transition-all flex items-center gap-2",
                                    isScrubbing ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                title="Time Travel (Chronos)"
                            >
                                <History size={18} />
                                {isScrubbing && <span className="text-[10px] font-bold">LIVE</span>}
                            </button>
                            <button
                                onClick={() => setLastRefresh(Date.now())}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <RefreshCw size={18} />
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowTimeRange(!showTimeRange)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm hover:bg-muted/80 transition-colors"
                                >
                                    <Clock size={14} />
                                    {timeRanges.find(r => r.value === (currentDashboard.timeRange?.from || 'now-1h'))?.label || 'Last 1h'}
                                    <ChevronDown size={14} />
                                </button>

                                {showTimeRange && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1">
                                        {timeRanges.map((range) => (
                                            <button
                                                key={range.value}
                                                onClick={() => {
                                                    updateCurrentDashboard({ timeRange: { from: range.value, to: 'now' } });
                                                    setShowTimeRange(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                                                    (currentDashboard.timeRange?.from || 'now-1h') === range.value && "text-primary font-medium"
                                                )}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleToggleEdit}
                                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                data-testid="edit-btn"
                            >
                                <Pencil size={16} />
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Dashboard content */}
            <div className="flex-1 overflow-auto p-6" data-testid="dashboard-grid">
                {/* Add panel button (edit mode) */}
                {isEditing && (
                    <div className="mb-4">
                        {showAddPanel ? (
                            <div className="p-4 border border-dashed border-border rounded-xl" data-testid="panel-type-selector">
                                <h3 className="text-sm font-medium mb-3">Select Visualization Type</h3>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                                    {(Object.keys(panelTypeIcons) as PanelType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => handleAddPanel(type)}
                                            className="flex flex-col items-center gap-1 p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                                            data-testid={`panel-type-${type}`}
                                        >
                                            <span className="text-2xl">{panelTypeIcons[type]}</span>
                                            <span className="text-xs capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowAddPanel(false)}
                                    className="mt-3 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <AddPanelButton onClick={() => setShowAddPanel(true)} />
                        )}
                    </div>
                )}

                {/* Panel grid */}
                <div className="grid grid-cols-12 gap-4 auto-rows-min">
                    {currentDashboard.panels.map((panel, index) => (
                        <ResizablePanel
                            key={panel.id}
                            initialWidth={panel.gridPos.w}
                            initialHeight={panel.gridPos.h}
                            minWidth={2}
                            maxWidth={12}
                            minHeight={2}
                            maxHeight={12}
                            isEditing={isEditing}
                            onResize={(width, height) => resizePanel(panel.id, width, height)}
                            className={cn(
                                "transition-all duration-200",
                                draggedPanelIndex === index && "opacity-50 scale-95",
                                dragOverIndex === index && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                        >
                            <div
                                className={cn(
                                    "h-full",
                                    isEditing && "cursor-move"
                                )}
                                draggable={isEditing}
                                onDragStart={isEditing ? handleDragStart(index) : undefined}
                                onDragOver={isEditing ? handleDragOver(index) : undefined}
                                onDragLeave={isEditing ? handleDragLeave : undefined}
                                onDrop={isEditing ? handleDrop(index) : undefined}
                                onDragEnd={isEditing ? handleDragEnd : undefined}
                            >
                                <PanelContent
                                    panel={panel}
                                    isEditing={isEditing}
                                    onEdit={() => setEditingPanel(panel.id)}
                                    onDelete={() => deletePanel(panel.id)}
                                    timeRange={currentDashboard.timeRange || { from: 'now-1h', to: 'now' }}
                                    lastRefresh={lastRefresh}
                                />
                            </div>
                        </ResizablePanel>
                    ))}
                </div>

                {/* Empty state */}
                {currentDashboard.panels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Plus className="text-muted-foreground" size={24} />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No panels yet</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                            {isEditing
                                ? 'Click "Add visualization" to add your first panel.'
                                : 'This dashboard is empty. Click Edit to add panels.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Panel Editor */}
            <PanelEditor
                panel={editingPanel || null}
                isOpen={!!editingPanelId}
                onClose={() => setEditingPanel(null)}
                onSave={(updated) => {
                    updatePanel(updated.id, updated);
                    setEditingPanel(null);
                }}
            />

            {/* Dashboard Settings Modal */}
            {currentDashboard && (
                <DashboardSettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    dashboard={currentDashboard}
                    onSave={handleUpdateSettings}
                    onDelete={handleDeleteDashboard}
                />
            )}

            {/* Unsaved Changes Modal */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onClose={() => setShowUnsavedModal(false)}
                onDiscard={handleUnsavedDiscard}
                onSave={handleUnsavedSave}
            />

            {/* Chronos Scrubber Overlay */}
            <ChronosScrubber />
        </>
    );
}
