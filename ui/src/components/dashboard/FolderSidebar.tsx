'use client';

import React, { useState } from 'react';
import {
    Folder,
    FolderPlus,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Trash2,
    X,
    Check,
    LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import type { Folder as FolderType } from '@/types/dashboard';

interface FolderSidebarProps {
    folders: FolderType[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onCreateFolder: (title: string, parentId?: string) => void;
    onRenameFolder: (folderId: string, title: string) => void;
    onDeleteFolder: (folderId: string) => void;
}

export function FolderSidebar({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
}: FolderSidebarProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    // Toggle folder expansion
    const toggleExpand = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Build folder tree
    const buildFolderTree = (parentId?: string): FolderType[] => {
        return folders.filter(f => f.parentId === parentId);
    };

    // Start editing folder name
    const startEditing = (folder: FolderType) => {
        setEditingFolderId(folder.id);
        setEditingTitle(folder.title);
        setMenuOpenId(null);
    };

    // Save folder name
    const saveEditing = () => {
        if (editingFolderId && editingTitle.trim()) {
            onRenameFolder(editingFolderId, editingTitle.trim());
        }
        setEditingFolderId(null);
        setEditingTitle('');
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingFolderId(null);
        setEditingTitle('');
    };

    // Delete folder
    const handleDeleteClick = (folder: FolderType) => {
        setFolderToDelete(folder);
        setShowDeleteConfirm(true);
        setMenuOpenId(null);
    };

    const confirmDelete = () => {
        if (folderToDelete) {
            onDeleteFolder(folderToDelete.id);
        }
        setShowDeleteConfirm(false);
        setFolderToDelete(null);
    };

    // Create new folder
    const handleCreate = () => {
        if (newFolderTitle.trim()) {
            onCreateFolder(newFolderTitle.trim());
            setNewFolderTitle('');
            setShowCreateModal(false);
        }
    };

    // Render folder item
    const renderFolder = (folder: FolderType, depth: number = 0) => {
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolderId === folder.id;
        const isEditing = editingFolderId === folder.id;
        const children = buildFolderTree(folder.id);

        return (
            <div key={folder.id}>
                <div
                    className={cn(
                        "group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
                        depth > 0 && "ml-4"
                    )}
                >
                    {/* Expand/Collapse */}
                    {children.length > 0 ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id); }}
                            className="p-0.5 hover:bg-muted rounded"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <span className="w-5" />
                    )}

                    {/* Folder Icon & Name */}
                    <div
                        className="flex-1 flex items-center gap-2 min-w-0"
                        onClick={() => onSelectFolder(folder.id)}
                    >
                        <Folder size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                        {isEditing ? (
                            <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditing();
                                    if (e.key === 'Escape') cancelEditing();
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="flex-1 px-1 py-0.5 bg-muted border border-primary rounded text-sm focus:outline-none"
                            />
                        ) : (
                            <span className="text-sm truncate">{folder.title}</span>
                        )}
                    </div>

                    {/* Dashboard count */}
                    {folder.dashboardCount !== undefined && folder.dashboardCount > 0 && !isEditing && (
                        <span className="text-xs text-muted-foreground">{folder.dashboardCount}</span>
                    )}

                    {/* Edit actions when editing */}
                    {isEditing && (
                        <div className="flex items-center gap-1">
                            <button onClick={saveEditing} className="p-1 hover:bg-muted rounded text-emerald-500">
                                <Check size={14} />
                            </button>
                            <button onClick={cancelEditing} className="p-1 hover:bg-muted rounded text-destructive">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Menu button */}
                    {!isEditing && (
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === folder.id ? null : folder.id); }}
                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                            >
                                <MoreHorizontal size={14} />
                            </button>

                            {/* Dropdown menu */}
                            {menuOpenId === folder.id && (
                                <div
                                    className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-10"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => startEditing(folder)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                    >
                                        <Pencil size={14} /> Rename
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(folder)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Children */}
                {isExpanded && children.map(child => renderFolder(child, depth + 1))}
            </div>
        );
    };

    const rootFolders = buildFolderTree(undefined);

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Folders</span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Create folder"
                >
                    <FolderPlus size={16} className="text-muted-foreground" />
                </button>
            </div>

            {/* All Dashboards */}
            <div
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                    selectedFolderId === null ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
                onClick={() => onSelectFolder(null)}
            >
                <LayoutGrid size={16} className={selectedFolderId === null ? "text-primary" : "text-muted-foreground"} />
                <span className="text-sm">All Dashboards</span>
            </div>

            {/* Folder list */}
            <div className="space-y-0.5">
                {rootFolders.map(folder => renderFolder(folder))}
            </div>

            {/* Empty state */}
            {folders.length === 0 && (
                <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                    No folders yet
                </div>
            )}

            {/* Create Folder Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); setNewFolderTitle(''); }}
                title="Create Folder"
                size="sm"
            >
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Folder Name</label>
                        <input
                            type="text"
                            value={newFolderTitle}
                            onChange={(e) => setNewFolderTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            placeholder="My Folder"
                            autoFocus
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => { setShowCreateModal(false); setNewFolderTitle(''); }}
                            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newFolderTitle.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setFolderToDelete(null); }}
                onConfirm={confirmDelete}
                title="Delete Folder"
                description={`Are you sure you want to delete "${folderToDelete?.title}"? Dashboards in this folder will be moved to the root level.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </div>
    );
}

export default FolderSidebar;
