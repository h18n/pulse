"use client";

import React, { useState } from 'react';
import {
    Bell,
    Mail,
    MessageSquare,
    Webhook,
    Plus,
    MoreVertical,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Send,
    Settings,
    ChevronRight,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ChannelType = 'email' | 'slack' | 'webhook' | 'pagerduty' | 'teams';

interface NotificationChannel {
    id: string;
    name: string;
    type: ChannelType;
    enabled: boolean;
    config: Record<string, any>;
    lastTest?: string;
    lastTestSuccess?: boolean;
    createdAt: string;
}

// Mock channels data
const MOCK_CHANNELS: NotificationChannel[] = [
    {
        id: '1',
        name: 'Ops Team Email',
        type: 'email',
        enabled: true,
        config: {
            addresses: ['ops@example.com', 'alerts@example.com'],
            subject: '[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}'
        },
        lastTest: new Date(Date.now() - 86400000).toISOString(),
        lastTestSuccess: true,
        createdAt: '2025-11-01T10:00:00Z',
    },
    {
        id: '2',
        name: '#alerts-critical',
        type: 'slack',
        enabled: true,
        config: {
            channel: '#alerts-critical',
            webhookUrl: 'https://hooks.slack.com/services/xxx/yyy/zzz',
            mentionUsers: ['@oncall']
        },
        lastTest: new Date(Date.now() - 172800000).toISOString(),
        lastTestSuccess: true,
        createdAt: '2025-11-05T14:00:00Z',
    },
    {
        id: '3',
        name: 'PagerDuty - Infrastructure',
        type: 'pagerduty',
        enabled: true,
        config: {
            serviceKey: 'abcd1234...',
            severity: 'auto'
        },
        lastTest: new Date(Date.now() - 604800000).toISOString(),
        lastTestSuccess: true,
        createdAt: '2025-10-20T09:00:00Z',
    },
    {
        id: '4',
        name: 'Custom Webhook',
        type: 'webhook',
        enabled: false,
        config: {
            url: 'https://api.internal.com/alerts',
            method: 'POST',
            headers: { 'Authorization': 'Bearer xxx' }
        },
        lastTest: new Date(Date.now() - 2592000000).toISOString(),
        lastTestSuccess: false,
        createdAt: '2025-09-15T11:00:00Z',
    },
    {
        id: '5',
        name: 'MS Teams - Platform',
        type: 'teams',
        enabled: true,
        config: {
            webhookUrl: 'https://outlook.office.com/webhook/xxx'
        },
        createdAt: '2025-12-01T16:00:00Z',
    },
];

const CHANNEL_ICONS: Record<ChannelType, React.ReactNode> = {
    email: <Mail size={20} />,
    slack: <MessageSquare size={20} />,
    webhook: <Webhook size={20} />,
    pagerduty: <Bell size={20} />,
    teams: <MessageSquare size={20} />,
};

const CHANNEL_COLORS: Record<ChannelType, string> = {
    email: 'bg-blue-500/10 text-blue-500',
    slack: 'bg-purple-500/10 text-purple-500',
    webhook: 'bg-orange-500/10 text-orange-500',
    pagerduty: 'bg-green-500/10 text-green-500',
    teams: 'bg-indigo-500/10 text-indigo-500',
};

export default function NotificationChannelsPage() {
    const [channels, setChannels] = useState(MOCK_CHANNELS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);

    const toggleChannel = (id: string) => {
        setChannels(prev => prev.map(ch =>
            ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
        ));
    };

    const enabledCount = channels.filter(c => c.enabled).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                            <Send size={20} className="text-violet-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Notification Channels</h1>
                            <p className="text-sm text-muted-foreground">
                                Configure where alerts are sent
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Add Channel
                    </button>
                </div>

                <div className="flex items-center gap-6 text-sm mt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{channels.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Enabled:</span>
                        <span className="font-medium">{enabledCount}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channels.map(channel => (
                        <ChannelCard
                            key={channel.id}
                            channel={channel}
                            onToggle={() => toggleChannel(channel.id)}
                            onClick={() => setSelectedChannel(channel)}
                        />
                    ))}

                    {/* Add New Card */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-foreground min-h-[180px]"
                    >
                        <Plus size={24} className="mb-2" />
                        <span className="text-sm font-medium">Add Channel</span>
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <CreateChannelModal onClose={() => setIsCreateModalOpen(false)} />
            )}

            {/* Detail Modal */}
            {selectedChannel && (
                <ChannelDetailModal
                    channel={selectedChannel}
                    onClose={() => setSelectedChannel(null)}
                />
            )}
        </div>
    );
}

// ============== Components ==============

interface ChannelCardProps {
    channel: NotificationChannel;
    onToggle: () => void;
    onClick: () => void;
}

function ChannelCard({ channel, onToggle, onClick }: ChannelCardProps) {
    return (
        <div
            className={cn(
                "p-4 bg-card border rounded-xl transition-all cursor-pointer group",
                channel.enabled ? "border-border hover:border-primary/30" : "border-border/50 opacity-60"
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", CHANNEL_COLORS[channel.type])}>
                    {CHANNEL_ICONS[channel.type]}
                </div>

                <div className="flex items-center gap-2">
                    {channel.lastTest && (
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            channel.lastTestSuccess ? "bg-emerald-500" : "bg-red-500"
                        )} title={channel.lastTestSuccess ? "Last test passed" : "Last test failed"} />
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className={cn(
                            "relative w-10 h-5 rounded-full transition-colors",
                            channel.enabled ? "bg-primary" : "bg-muted"
                        )}
                    >
                        <span className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                            channel.enabled ? "translate-x-5" : "translate-x-0.5"
                        )} />
                    </button>
                </div>
            </div>

            <h3 className="font-medium mb-1 truncate">{channel.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {channel.lastTest
                        ? `Tested ${getRelativeTime(new Date(channel.lastTest))}`
                        : 'Never tested'}
                </span>
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}

interface CreateChannelModalProps {
    onClose: () => void;
}

function CreateChannelModal({ onClose }: CreateChannelModalProps) {
    const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
    const [name, setName] = useState('');

    const channelTypes: { type: ChannelType; label: string; description: string }[] = [
        { type: 'email', label: 'Email', description: 'Send alerts via email' },
        { type: 'slack', label: 'Slack', description: 'Post to Slack channels' },
        { type: 'webhook', label: 'Webhook', description: 'Custom HTTP endpoint' },
        { type: 'pagerduty', label: 'PagerDuty', description: 'Incident management' },
        { type: 'teams', label: 'Microsoft Teams', description: 'Teams notifications' },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-bold">Add Notification Channel</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {!selectedType ? (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">Choose a channel type:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {channelTypes.map(ct => (
                                    <button
                                        key={ct.type}
                                        onClick={() => setSelectedType(ct.type)}
                                        className="p-4 bg-muted/50 border border-border rounded-lg hover:border-primary/50 transition-colors text-left"
                                    >
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", CHANNEL_COLORS[ct.type])}>
                                            {CHANNEL_ICONS[ct.type]}
                                        </div>
                                        <h3 className="font-medium text-sm">{ct.label}</h3>
                                        <p className="text-xs text-muted-foreground">{ct.description}</p>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setSelectedType(null)}
                                className="text-sm text-primary hover:underline mb-4"
                            >
                                ← Change type
                            </button>

                            <div>
                                <label className="block text-sm font-medium mb-1">Channel Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={`My ${selectedType} channel`}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                                />
                            </div>

                            {selectedType === 'email' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email Addresses</label>
                                    <input
                                        type="text"
                                        placeholder="alerts@example.com, ops@example.com"
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Separate multiple addresses with commas</p>
                                </div>
                            )}

                            {selectedType === 'slack' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Webhook URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://hooks.slack.com/services/..."
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Channel</label>
                                        <input
                                            type="text"
                                            placeholder="#alerts"
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {selectedType === 'webhook' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Endpoint URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://api.example.com/alerts"
                                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">HTTP Method</label>
                                        <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none">
                                            <option>POST</option>
                                            <option>PUT</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedType === 'pagerduty' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Integration Key</label>
                                    <input
                                        type="text"
                                        placeholder="Your PagerDuty integration key"
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none"
                                    />
                                </div>
                            )}

                            {selectedType === 'teams' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Webhook URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://outlook.office.com/webhook/..."
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {selectedType && (
                    <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                            Create Channel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ChannelDetailModalProps {
    channel: NotificationChannel;
    onClose: () => void;
}

function ChannelDetailModal({ channel, onClose }: ChannelDetailModalProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", CHANNEL_COLORS[channel.type])}>
                            {CHANNEL_ICONS[channel.type]}
                        </div>
                        <div>
                            <h2 className="font-bold">{channel.name}</h2>
                            <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Status</span>
                        <span className={cn(
                            "flex items-center gap-1.5 text-sm font-medium",
                            channel.enabled ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                            {channel.enabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {channel.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    {channel.lastTest && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm">Last Test</span>
                            <span className={cn(
                                "flex items-center gap-1.5 text-sm",
                                channel.lastTestSuccess ? "text-emerald-500" : "text-red-500"
                            )}>
                                {channel.lastTestSuccess ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                {getRelativeTime(new Date(channel.lastTest))}
                            </span>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-medium mb-2">Configuration</h4>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <pre className="text-xs font-mono overflow-auto">
                                {JSON.stringify(channel.config, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border px-6 py-4 flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-destructive">
                        <Trash2 size={14} />
                        Delete
                    </button>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border hover:bg-muted rounded-lg transition-colors">
                            <Zap size={14} />
                            Test
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                            <Edit3 size={14} />
                            Edit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function
function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}
