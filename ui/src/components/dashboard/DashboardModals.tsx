'use client';

import { useState, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import type { Dashboard } from '@/types/dashboard';

interface DashboardSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dashboard: Dashboard;
    onSave: (updates: Partial<Dashboard>) => void;
    onDelete: () => void;
}

export function DashboardSettingsModal({
    isOpen,
    onClose,
    dashboard,
    onSave,
    onDelete,
}: DashboardSettingsModalProps) {
    const [title, setTitle] = useState(dashboard.title);
    const [description, setDescription] = useState(dashboard.description || '');
    const [tags, setTags] = useState(dashboard.tags.join(', '));
    const [refreshInterval, setRefreshInterval] = useState(dashboard.refreshInterval || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(dashboard.title);
            setDescription(dashboard.description || '');
            setTags(dashboard.tags.join(', '));
            setRefreshInterval(dashboard.refreshInterval || '');
        }
    }, [isOpen, dashboard]);

    const handleSave = () => {
        onSave({
            title,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            refreshInterval: refreshInterval || undefined,
        });
        onClose();
    };

    const handleDelete = () => {
        setShowDeleteConfirm(false);
        onDelete();
    };

    const refreshOptions = [
        { label: 'Off', value: '' },
        { label: '5s', value: '5s' },
        { label: '10s', value: '10s' },
        { label: '30s', value: '30s' },
        { label: '1m', value: '1m' },
        { label: '5m', value: '5m' },
        { label: '15m', value: '15m' },
        { label: '30m', value: '30m' },
        { label: '1h', value: '1h' },
    ];

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Dashboard Settings"
                size="md"
            >
                <div className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none"
                            placeholder="Dashboard title"
                            data-testid="settings-title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none resize-none"
                            rows={3}
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Tags</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none"
                            placeholder="tag1, tag2, tag3"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Comma-separated list of tags</p>
                    </div>

                    {/* Refresh Interval */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Auto Refresh</label>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none"
                        >
                            {refreshOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-medium text-destructive mb-3">Danger Zone</h3>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors"
                            data-testid="delete-dashboard-btn"
                        >
                            <Trash2 size={16} />
                            Delete Dashboard
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Dashboard"
                description={`Are you sure you want to delete "${dashboard.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </>
    );
}

// Unsaved Changes Warning Modal
interface UnsavedChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDiscard: () => void;
    onSave: () => void;
}

export function UnsavedChangesModal({
    isOpen,
    onClose,
    onDiscard,
    onSave,
}: UnsavedChangesModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Unsaved Changes"
            description="You have unsaved changes. What would you like to do?"
            size="sm"
        >
            <div className="px-6 py-4 flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                    Keep Editing
                </button>
                <button
                    onClick={onDiscard}
                    className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors"
                    data-testid="discard-changes"
                >
                    Discard
                </button>
                <button
                    onClick={onSave}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    data-testid="save-changes"
                >
                    Save
                </button>
            </div>
        </Modal>
    );
}

// Duplicate Dashboard Modal
interface DuplicateDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDuplicate: (title: string) => void;
    originalTitle: string;
    isLoading?: boolean;
}

export function DuplicateDashboardModal({
    isOpen,
    onClose,
    onDuplicate,
    originalTitle,
    isLoading = false,
}: DuplicateDashboardModalProps) {
    const [title, setTitle] = useState(`${originalTitle} (Copy)`);

    useEffect(() => {
        if (isOpen) {
            setTitle(`${originalTitle} (Copy)`);
        }
    }, [isOpen, originalTitle]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Duplicate Dashboard"
            size="sm"
        >
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">New Dashboard Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:ring-2 ring-primary focus:outline-none"
                        placeholder="Dashboard title"
                        autoFocus
                        data-testid="duplicate-title"
                    />
                </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onDuplicate(title)}
                    disabled={!title.trim() || isLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    data-testid="duplicate-confirm"
                >
                    {isLoading ? 'Duplicating...' : 'Duplicate'}
                </button>
            </div>
        </Modal>
    );
}
