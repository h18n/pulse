'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Star,
    Grid3X3,
    List,
    FolderClosed,
    FolderPlus,
    Clock,
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    X,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { DuplicateDashboardModal } from '@/components/dashboard/DashboardModals';
import type { DashboardListItem, Folder } from '@/types/dashboard';

// Format relative time
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Dashboard Card Component
function DashboardCard({
    dashboard,
    onStar,
    onDelete,
    onDuplicate,
    isListView = false,
}: {
    dashboard: DashboardListItem;
    onStar: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string, title: string) => void;
    isListView?: boolean;
}) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDuplicate, setShowDuplicate] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(dashboard.id);
        setShowDeleteConfirm(false);
        setIsDeleting(false);
    };

    const handleDuplicate = async (title: string) => {
        setIsDuplicating(true);
        await onDuplicate(dashboard.id, title);
        setShowDuplicate(false);
        setIsDuplicating(false);
    };

    if (isListView) {
        return (
            <>
                <div
                    className="group flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
                    onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                dashboard.starred
                                    ? "text-yellow-500"
                                    : "text-muted-foreground hover:text-yellow-500 hover:bg-muted"
                            )}
                            onClick={(e) => { e.stopPropagation(); onStar(dashboard.id); }}
                        >
                            <Star size={16} fill={dashboard.starred ? 'currentColor' : 'none'} />
                        </button>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{dashboard.title}</h3>
                            {dashboard.description && (
                                <p className="text-xs text-muted-foreground truncate">{dashboard.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground hidden md:block">
                            {formatRelativeTime(dashboard.updatedAt)}
                        </span>
                        <div className="relative">
                            <button
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-all"
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            >
                                <MoreHorizontal size={16} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-xl z-20 py-1">
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                        onClick={(e) => { e.stopPropagation(); setShowDuplicate(true); setShowMenu(false); }}
                                    >
                                        <Copy size={14} /> Duplicate
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); setShowMenu(false); }}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDelete}
                    title="Delete Dashboard"
                    description={`Are you sure you want to delete "${dashboard.title}"? This action cannot be undone.`}
                    confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
                    variant="destructive"
                />
                <DuplicateDashboardModal
                    isOpen={showDuplicate}
                    onClose={() => setShowDuplicate(false)}
                    onDuplicate={handleDuplicate}
                    originalTitle={dashboard.title}
                    isLoading={isDuplicating}
                />
            </>
        );
    }

    return (
        <>
            <div
                className="group relative p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                data-testid="dashboard-card"
            >
                {/* Star button */}
                <button
                    className={cn(
                        "absolute top-3 right-3 p-1.5 rounded-lg transition-all z-10",
                        dashboard.starred
                            ? "text-yellow-500"
                            : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-500 hover:bg-muted"
                    )}
                    onClick={(e) => { e.stopPropagation(); onStar(dashboard.id); }}
                    data-testid="star-btn"
                >
                    <Star size={16} fill={dashboard.starred ? 'currentColor' : 'none'} />
                </button>

                {/* Menu button */}
                <button
                    className="absolute top-3 right-10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted transition-all z-10"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                >
                    <MoreHorizontal size={16} />
                </button>

                {/* Menu dropdown */}
                {showMenu && (
                    <div
                        className="absolute top-10 right-3 w-40 bg-card border border-border rounded-lg shadow-xl z-20 py-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => { router.push(`/dashboards/${dashboard.id}`); }}
                        >
                            <Pencil size={14} /> Edit
                        </button>
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => { setShowDuplicate(true); setShowMenu(false); }}
                        >
                            <Copy size={14} /> Duplicate
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="pt-6">
                    <h3 className="font-semibold text-sm mb-1 truncate">{dashboard.title}</h3>
                    {dashboard.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {dashboard.description}
                        </p>
                    )}

                    {/* Tags */}
                    {dashboard.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {dashboard.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{formatRelativeTime(dashboard.updatedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Modals (rendered outside to avoid z-index issues) */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Dashboard"
                description={`Are you sure you want to delete "${dashboard.title}"? This action cannot be undone.`}
                confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
                variant="destructive"
            />
            <DuplicateDashboardModal
                isOpen={showDuplicate}
                onClose={() => setShowDuplicate(false)}
                onDuplicate={handleDuplicate}
                originalTitle={dashboard.title}
                isLoading={isDuplicating}
            />
        </>
    );
}

// Folder Card with inline edit/delete
function FolderCard({
    folder,
    dashboardCount,
    onSelect,
    onRename,
    onDelete,
}: {
    folder: Folder;
    dashboardCount: number;
    onSelect: () => void;
    onRename: (id: string, title: string) => void;
    onDelete: (id: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(folder.title);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleSaveRename = () => {
        if (editTitle.trim() && editTitle !== folder.title) {
            onRename(folder.id, editTitle.trim());
        }
        setIsEditing(false);
    };

    return (
        <>
            <div
                className="group p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer relative"
                onClick={() => !isEditing && onSelect()}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                        <FolderClosed size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                    className="flex-1 px-2 py-1 bg-muted border border-border rounded text-sm"
                                    autoFocus
                                />
                                <button onClick={handleSaveRename} className="p-1 text-emerald-500 hover:bg-muted rounded">
                                    <Check size={14} />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="font-semibold text-sm truncate">{folder.title}</h3>
                                <p className="text-xs text-muted-foreground">{dashboardCount} dashboards</p>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="relative">
                            <button
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted transition-all"
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            >
                                <MoreHorizontal size={16} />
                            </button>
                            {showMenu && (
                                <div
                                    className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-20 py-1"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                    >
                                        <Pencil size={14} /> Rename
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => { onDelete(folder.id); setShowDeleteConfirm(false); }}
                title="Delete Folder"
                description={`Are you sure you want to delete "${folder.title}"? Dashboards in this folder will be moved to the root.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </>
    );
}

// Create Folder Modal
function CreateFolderModal({ isOpen, onClose, onCreate }: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string) => void;
}) {
    const [title, setTitle] = useState('');

    const handleSubmit = () => {
        if (title.trim()) {
            onCreate(title.trim());
            setTitle('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Folder" size="sm">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Folder Name</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="e.g., Production Dashboards"
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                        Create
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default function DashboardsPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);

    const {
        dashboards,
        starredDashboards,
        recentDashboards,
        folders,
        isLoading,
        searchQuery,
        sortBy,
        selectedFolder,
        fetchDashboards,
        setSearchQuery,
        setSortBy,
        setSelectedFolder,
        toggleStar,
        deleteDashboard,
        duplicateDashboard,
        createFolder,
        renameFolder,
        deleteFolder,
    } = useDashboardStore();

    // Compute filtered dashboards locally with useMemo
    const filteredDashboards = useMemo(() => {
        let filtered = [...dashboards];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (d) =>
                    d.title.toLowerCase().includes(query) ||
                    d.tags.some((t) => t.toLowerCase().includes(query)) ||
                    d.description?.toLowerCase().includes(query)
            );
        }

        // Filter by folder
        if (selectedFolder) {
            filtered = filtered.filter((d) => d.folderId === selectedFolder);
        }

        // Sort
        switch (sortBy) {
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
    }, [dashboards, searchQuery, selectedFolder, sortBy]);

    // Get dashboard count per folder
    const folderDashboardCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        folders.forEach(f => {
            counts[f.id] = dashboards.filter(d => d.folderId === f.id).length;
        });
        return counts;
    }, [folders, dashboards]);

    useEffect(() => {
        fetchDashboards();
    }, [fetchDashboards]);

    const handleNewDashboard = () => {
        router.push('/dashboards/new');
    };

    const sortOptions = [
        { value: 'updated', label: 'Recently Updated' },
        { value: 'created', label: 'Recently Created' },
        { value: 'name', label: 'Name (A-Z)' },
    ];

    return (
        <div className="p-6 space-y-6 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboards</h1>
                <button
                    onClick={handleNewDashboard}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    data-testid="new-dashboard-btn"
                >
                    <Plus size={18} />
                    New Dashboard
                </button>
            </div>

            {/* Search and filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search dashboards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none"
                        data-testid="dashboard-search"
                    />
                </div>

                {/* Sort dropdown - now functional */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-muted/80 transition-colors"
                    >
                        <Clock size={16} />
                        {sortOptions.find(o => o.value === sortBy)?.label || 'Sort'}
                        <ChevronDown size={14} />
                    </button>
                    {showSortDropdown && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-20 py-1">
                            {sortOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => { setSortBy(option.value as 'updated' | 'created' | 'name'); setShowSortDropdown(false); }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                                        sortBy === option.value && "bg-primary/10 text-primary"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* View toggle - now functional */}
                <div className="flex items-center bg-muted border border-border rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            viewMode === 'list' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* Starred Section */}
                    {starredDashboards.length > 0 && !searchQuery && (
                        <section>
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4" data-testid="starred-section">
                                <Star size={16} className="text-yellow-500" />
                                STARRED
                            </h2>
                            <div className={viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "space-y-2"
                            }>
                                {starredDashboards.map((dashboard) => (
                                    <DashboardCard
                                        key={dashboard.id}
                                        dashboard={dashboard}
                                        onStar={toggleStar}
                                        onDelete={deleteDashboard}
                                        onDuplicate={duplicateDashboard}
                                        isListView={viewMode === 'list'}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Recent Section */}
                    {recentDashboards.length > 0 && !searchQuery && (
                        <section>
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                                <Clock size={16} />
                                RECENT
                            </h2>
                            <div className={viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "space-y-2"
                            }>
                                {recentDashboards.filter(d => !d.starred).slice(0, 4).map((dashboard) => (
                                    <DashboardCard
                                        key={dashboard.id}
                                        dashboard={dashboard}
                                        onStar={toggleStar}
                                        onDelete={deleteDashboard}
                                        onDuplicate={duplicateDashboard}
                                        isListView={viewMode === 'list'}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Folders Section - at the bottom with inline CRUD */}
                    {!searchQuery && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <FolderClosed size={16} />
                                    FOLDERS
                                </h2>
                                <button
                                    onClick={() => setShowCreateFolder(true)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                    <FolderPlus size={14} />
                                    New Folder
                                </button>
                            </div>
                            {folders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No folders yet. Create one to organize your dashboards.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {folders.map((folder) => (
                                        <FolderCard
                                            key={folder.id}
                                            folder={folder}
                                            dashboardCount={folderDashboardCounts[folder.id] || 0}
                                            onSelect={() => setSelectedFolder(folder.id)}
                                            onRename={renameFolder}
                                            onDelete={deleteFolder}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* All Dashboards (when searching or folder selected) */}
                    {(searchQuery || selectedFolder) && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-muted-foreground">
                                    {searchQuery ? `${filteredDashboards.length} RESULTS` : `${filteredDashboards.length} DASHBOARDS`}
                                </h2>
                                {selectedFolder && (
                                    <button
                                        onClick={() => setSelectedFolder(null)}
                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        <X size={12} /> Clear filter
                                    </button>
                                )}
                            </div>
                            <div className={viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "space-y-2"
                            }>
                                {filteredDashboards.map((dashboard) => (
                                    <DashboardCard
                                        key={dashboard.id}
                                        dashboard={dashboard}
                                        onStar={toggleStar}
                                        onDelete={deleteDashboard}
                                        onDuplicate={duplicateDashboard}
                                        isListView={viewMode === 'list'}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Empty state */}
                    {dashboards.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Grid3X3 className="text-muted-foreground" size={24} />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No dashboards yet</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                                Create your first dashboard to start monitoring your infrastructure.
                            </p>
                            <button
                                onClick={handleNewDashboard}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                            >
                                <Plus size={18} />
                                Create Dashboard
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                onCreate={createFolder}
            />
        </div>
    );
}
