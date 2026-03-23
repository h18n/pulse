'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Link,
    Copy,
    Check,
    Globe,
    Lock,
    UserPlus,
    X,
    Trash2,
    ChevronDown,
    Mail,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

// Permission levels
export type PermissionLevel = 'view' | 'edit' | 'admin';

// User permission
export interface UserPermission {
    userId: string;
    email: string;
    name: string;
    avatar?: string;
    permission: PermissionLevel;
    addedAt: string;
    addedBy: string;
}

// Dashboard sharing settings
export interface SharingSettings {
    dashboardId: string;
    visibility: 'private' | 'organization' | 'public';
    linkSharing: boolean;
    shareLink?: string;
    permissions: UserPermission[];
    defaultPermission: PermissionLevel;
}

const PERMISSION_LABELS: Record<PermissionLevel, { label: string; description: string }> = {
    view: { label: 'Viewer', description: 'Can view dashboard' },
    edit: { label: 'Editor', description: 'Can edit panels and settings' },
    admin: { label: 'Admin', description: 'Full access including sharing' },
};

interface ShareDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    dashboardId: string;
    dashboardTitle: string;
    settings: SharingSettings;
    onUpdateSettings: (settings: Partial<SharingSettings>) => void;
    onAddUser: (email: string, permission: PermissionLevel) => Promise<void>;
    onRemoveUser: (userId: string) => Promise<void>;
    onUpdateUserPermission: (userId: string, permission: PermissionLevel) => Promise<void>;
}

export function ShareDashboardModal({
    isOpen,
    onClose,
    dashboardId,
    dashboardTitle,
    settings,
    onUpdateSettings,
    onAddUser,
    onRemoveUser,
    onUpdateUserPermission,
}: ShareDashboardModalProps) {
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePermission, setInvitePermission] = useState<PermissionLevel>('view');
    const [isInviting, setIsInviting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showPermissionMenu, setShowPermissionMenu] = useState<string | null>(null);

    // Generate share link
    const shareLink = settings.shareLink || `${window.location.origin}/dashboards/${dashboardId}?shared=true`;

    // Copy link to clipboard
    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Add user
    const handleInvite = async () => {
        if (!inviteEmail || !inviteEmail.includes('@')) return;

        setIsInviting(true);
        try {
            await onAddUser(inviteEmail, invitePermission);
            setInviteEmail('');
        } catch (err) {
            console.error('Failed to invite user:', err);
        } finally {
            setIsInviting(false);
        }
    };

    // Update visibility
    const handleVisibilityChange = (visibility: SharingSettings['visibility']) => {
        onUpdateSettings({ visibility });
    };

    // Toggle link sharing
    const handleLinkSharingToggle = () => {
        onUpdateSettings({ linkSharing: !settings.linkSharing });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Share "${dashboardTitle}"`}
            size="md"
        >
            <div className="p-6 space-y-6">
                {/* Visibility Settings */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Visibility</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleVisibilityChange('private')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors",
                                settings.visibility === 'private'
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <Lock size={20} className={settings.visibility === 'private' ? 'text-primary' : 'text-muted-foreground'} />
                            <div className="text-sm font-medium">Private</div>
                            <div className="text-xs text-muted-foreground text-center">Only invited users</div>
                        </button>

                        <button
                            onClick={() => handleVisibilityChange('organization')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors",
                                settings.visibility === 'organization'
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <Users size={20} className={settings.visibility === 'organization' ? 'text-primary' : 'text-muted-foreground'} />
                            <div className="text-sm font-medium">Organization</div>
                            <div className="text-xs text-muted-foreground text-center">Anyone in org</div>
                        </button>

                        <button
                            onClick={() => handleVisibilityChange('public')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors",
                                settings.visibility === 'public'
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <Globe size={20} className={settings.visibility === 'public' ? 'text-primary' : 'text-muted-foreground'} />
                            <div className="text-sm font-medium">Public</div>
                            <div className="text-xs text-muted-foreground text-center">Anyone with link</div>
                        </button>
                    </div>
                </div>

                {/* Link Sharing */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Link size={16} />
                            Share Link
                        </label>
                        <button
                            onClick={handleLinkSharingToggle}
                            className={cn(
                                "w-10 h-6 rounded-full transition-colors relative",
                                settings.linkSharing ? "bg-primary" : "bg-muted"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                                settings.linkSharing ? "translate-x-5" : "translate-x-1"
                            )} />
                        </button>
                    </div>

                    {settings.linkSharing && (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono text-muted-foreground"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Invite Users */}
                <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <UserPlus size={16} />
                        Invite People
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                placeholder="Enter email address"
                                className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <select
                            value={invitePermission}
                            onChange={(e) => setInvitePermission(e.target.value as PermissionLevel)}
                            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                        >
                            {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleInvite}
                            disabled={!inviteEmail || isInviting}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                        >
                            {isInviting ? '...' : 'Invite'}
                        </button>
                    </div>
                </div>

                {/* Users with Access */}
                <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Shield size={16} />
                        People with Access ({settings.permissions.length})
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {settings.permissions.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                No one else has access yet
                            </div>
                        ) : (
                            settings.permissions.map((user) => (
                                <div
                                    key={user.userId}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Permission dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowPermissionMenu(showPermissionMenu === user.userId ? null : user.userId)}
                                                className="flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded hover:bg-muted/80"
                                            >
                                                {PERMISSION_LABELS[user.permission].label}
                                                <ChevronDown size={14} />
                                            </button>
                                            {showPermissionMenu === user.userId && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                                                    {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => {
                                                                onUpdateUserPermission(user.userId, key as PermissionLevel);
                                                                setShowPermissionMenu(null);
                                                            }}
                                                            className={cn(
                                                                "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                                                                user.permission === key && "bg-primary/10"
                                                            )}
                                                        >
                                                            <div className="font-medium">{label}</div>
                                                            <div className="text-xs text-muted-foreground">{description}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => onRemoveUser(user.userId)}
                                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                >
                    Done
                </button>
            </div>
        </Modal>
    );
}

// Permission badge component
interface PermissionBadgeProps {
    permission: PermissionLevel;
    className?: string;
}

export function PermissionBadge({ permission, className }: PermissionBadgeProps) {
    const colors: Record<PermissionLevel, string> = {
        view: 'bg-blue-500/10 text-blue-500',
        edit: 'bg-amber-500/10 text-amber-500',
        admin: 'bg-emerald-500/10 text-emerald-500',
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            colors[permission],
            className
        )}>
            <Shield size={10} />
            {PERMISSION_LABELS[permission].label}
        </span>
    );
}

export default ShareDashboardModal;
