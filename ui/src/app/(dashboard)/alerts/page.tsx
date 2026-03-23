"use client";

import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    Bell,
    BellOff,
    CheckCircle2,
    Clock,
    Filter,
    MoreVertical,
    Plus,
    Search,
    XCircle,
    ChevronDown,
    Eye,
    VolumeX,
    Trash2,
    RefreshCw,
    AlertCircle,
    Flame,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertState = 'firing' | 'pending' | 'resolved';

interface Alert {
    id: string;
    name: string;
    summary: string;
    severity: AlertSeverity;
    state: AlertState;
    source: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    startsAt: string;
    endsAt?: string;
    fingerprint: string;
    silenced?: boolean;
}

// Mock alerts data
const MOCK_ALERTS: Alert[] = [
    {
        id: '1',
        name: 'HighCPUUsage',
        summary: 'CPU usage is above 90% on prod-server-01',
        severity: 'critical',
        state: 'firing',
        source: 'prometheus',
        labels: { instance: 'prod-server-01', job: 'node', region: 'us-east' },
        annotations: { description: 'Current value: 94.5%' },
        startsAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        fingerprint: 'abc123',
    },
    {
        id: '2',
        name: 'HighMemoryUsage',
        summary: 'Memory usage is above 85% on prod-db-01',
        severity: 'warning',
        state: 'firing',
        source: 'prometheus',
        labels: { instance: 'prod-db-01', job: 'postgres', region: 'us-east' },
        annotations: { description: 'Current value: 87.2%' },
        startsAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        fingerprint: 'def456',
    },
    {
        id: '3',
        name: 'DiskSpaceLow',
        summary: 'Disk space below 10% on backup-server',
        severity: 'critical',
        state: 'firing',
        source: 'prometheus',
        labels: { instance: 'backup-server', job: 'node', region: 'eu-west' },
        annotations: { description: 'Current value: 8.3%' },
        startsAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        fingerprint: 'ghi789',
    },
    {
        id: '4',
        name: 'ServiceDown',
        summary: 'API Gateway is not responding',
        severity: 'critical',
        state: 'pending',
        source: 'blackbox',
        labels: { service: 'api-gateway', environment: 'production' },
        annotations: { description: 'Probe failed for 2 minutes' },
        startsAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        fingerprint: 'jkl012',
    },
    {
        id: '5',
        name: 'HighLatency',
        summary: 'Response time > 500ms on checkout service',
        severity: 'warning',
        state: 'resolved',
        source: 'prometheus',
        labels: { service: 'checkout', environment: 'production' },
        annotations: { description: 'P95 latency: 623ms' },
        startsAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        endsAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        fingerprint: 'mno345',
    },
    {
        id: '6',
        name: 'CertificateExpiry',
        summary: 'SSL certificate expires in 7 days',
        severity: 'info',
        state: 'firing',
        source: 'blackbox',
        labels: { domain: 'api.example.com' },
        annotations: { description: 'Certificate expires on 2026-01-16' },
        startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        fingerprint: 'pqr678',
    },
    {
        id: '7',
        name: 'DatabaseConnections',
        summary: 'Connection pool near capacity',
        severity: 'warning',
        state: 'firing',
        source: 'prometheus',
        labels: { database: 'primary', region: 'us-west' },
        annotations: { description: '92/100 connections in use' },
        startsAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        fingerprint: 'stu901',
        silenced: true,
    },
];

export default function AlertsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
    const [stateFilter, setStateFilter] = useState<AlertState | 'all'>('all');
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const filteredAlerts = useMemo(() => {
        return MOCK_ALERTS.filter(alert => {
            const matchesSearch =
                alert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                alert.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                Object.values(alert.labels).some(v => v.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
            const matchesState = stateFilter === 'all' || alert.state === stateFilter;

            return matchesSearch && matchesSeverity && matchesState;
        });
    }, [searchQuery, severityFilter, stateFilter]);

    const alertCounts = useMemo(() => ({
        total: MOCK_ALERTS.length,
        firing: MOCK_ALERTS.filter(a => a.state === 'firing').length,
        pending: MOCK_ALERTS.filter(a => a.state === 'pending').length,
        resolved: MOCK_ALERTS.filter(a => a.state === 'resolved').length,
        critical: MOCK_ALERTS.filter(a => a.severity === 'critical' && a.state !== 'resolved').length,
        warning: MOCK_ALERTS.filter(a => a.severity === 'warning' && a.state !== 'resolved').length,
    }), []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                            <Bell size={20} className="text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Alerts</h1>
                            <p className="text-sm text-muted-foreground">
                                Monitor and manage active alerts
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            <Plus size={16} />
                            Create Rule
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <StatBadge
                        icon={<Flame size={14} />}
                        label="Firing"
                        count={alertCounts.firing}
                        variant="firing"
                        active={stateFilter === 'firing'}
                        onClick={() => setStateFilter(stateFilter === 'firing' ? 'all' : 'firing')}
                    />
                    <StatBadge
                        icon={<Clock size={14} />}
                        label="Pending"
                        count={alertCounts.pending}
                        variant="pending"
                        active={stateFilter === 'pending'}
                        onClick={() => setStateFilter(stateFilter === 'pending' ? 'all' : 'pending')}
                    />
                    <StatBadge
                        icon={<CheckCircle2 size={14} />}
                        label="Resolved"
                        count={alertCounts.resolved}
                        variant="resolved"
                        active={stateFilter === 'resolved'}
                        onClick={() => setStateFilter(stateFilter === 'resolved' ? 'all' : 'resolved')}
                    />
                    <div className="h-6 w-px bg-border" />
                    <StatBadge
                        icon={<XCircle size={14} />}
                        label="Critical"
                        count={alertCounts.critical}
                        variant="critical"
                        active={severityFilter === 'critical'}
                        onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
                    />
                    <StatBadge
                        icon={<AlertTriangle size={14} />}
                        label="Warning"
                        count={alertCounts.warning}
                        variant="warning"
                        active={severityFilter === 'warning'}
                        onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'all' : 'warning')}
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="shrink-0 px-6 py-3 border-b border-border flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search alerts by name, summary, or labels..."
                        className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    />
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border",
                        showFilters
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted border-border hover:bg-muted/80"
                    )}
                >
                    <Filter size={14} />
                    Filters
                    {(severityFilter !== 'all' || stateFilter !== 'all') && (
                        <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                            {(severityFilter !== 'all' ? 1 : 0) + (stateFilter !== 'all' ? 1 : 0)}
                        </span>
                    )}
                </button>

                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <RefreshCw size={16} className="text-muted-foreground" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Alert List */}
                <div className="flex-1 overflow-auto">
                    <div className="divide-y divide-border">
                        {filteredAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                                <h3 className="text-lg font-medium mb-1">No alerts found</h3>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery || severityFilter !== 'all' || stateFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'All systems are operating normally'}
                                </p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <AlertRow
                                    key={alert.id}
                                    alert={alert}
                                    onClick={() => setSelectedAlert(alert)}
                                    isSelected={selectedAlert?.id === alert.id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Alert Detail Sidebar */}
                {selectedAlert && (
                    <AlertDetailSidebar
                        alert={selectedAlert}
                        onClose={() => setSelectedAlert(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ============== Components ==============

interface StatBadgeProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    variant: 'firing' | 'pending' | 'resolved' | 'critical' | 'warning';
    active?: boolean;
    onClick?: () => void;
}

function StatBadge({ icon, label, count, variant, active, onClick }: StatBadgeProps) {
    const colors = {
        firing: 'text-red-500 bg-red-500/10',
        pending: 'text-amber-500 bg-amber-500/10',
        resolved: 'text-emerald-500 bg-emerald-500/10',
        critical: 'text-red-500 bg-red-500/10',
        warning: 'text-amber-500 bg-amber-500/10',
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                colors[variant],
                active && "ring-2 ring-current ring-offset-2 ring-offset-background"
            )}
        >
            {icon}
            <span className="font-medium">{count}</span>
            <span className="text-muted-foreground">{label}</span>
        </button>
    );
}

interface AlertRowProps {
    alert: Alert;
    onClick: () => void;
    isSelected: boolean;
}

function AlertRow({ alert, onClick, isSelected }: AlertRowProps) {
    const severityConfig = {
        critical: { icon: <XCircle size={16} />, color: 'text-red-500', bg: 'bg-red-500/10' },
        warning: { icon: <AlertTriangle size={16} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        info: { icon: <Info size={16} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    };

    const stateConfig = {
        firing: { label: 'Firing', color: 'bg-red-500' },
        pending: { label: 'Pending', color: 'bg-amber-500' },
        resolved: { label: 'Resolved', color: 'bg-emerald-500' },
    };

    const config = severityConfig[alert.severity];
    const state = stateConfig[alert.state];
    const duration = getRelativeTime(new Date(alert.startsAt));

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors",
                isSelected && "bg-primary/5 border-l-2 border-l-primary"
            )}
        >
            {/* Severity Icon */}
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bg, config.color)}>
                {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{alert.name}</h3>
                    {alert.silenced && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            <VolumeX size={10} />
                            Silenced
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{alert.summary}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {Object.entries(alert.labels).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {key}={value}
                        </span>
                    ))}
                    {Object.keys(alert.labels).length > 3 && (
                        <span className="text-xs text-muted-foreground">
                            +{Object.keys(alert.labels).length - 3} more
                        </span>
                    )}
                </div>
            </div>

            {/* State & Time */}
            <div className="text-right shrink-0">
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white",
                    state.color
                )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {state.label}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{duration}</p>
            </div>

            {/* Actions */}
            <button
                onClick={(e) => { e.stopPropagation(); }}
                className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            >
                <MoreVertical size={16} className="text-muted-foreground" />
            </button>
        </div>
    );
}

interface AlertDetailSidebarProps {
    alert: Alert;
    onClose: () => void;
}

function AlertDetailSidebar({ alert, onClose }: AlertDetailSidebarProps) {
    const severityConfig = {
        critical: { label: 'Critical', color: 'text-red-500 bg-red-500/10' },
        warning: { label: 'Warning', color: 'text-amber-500 bg-amber-500/10' },
        info: { label: 'Info', color: 'text-blue-500 bg-blue-500/10' },
    };

    return (
        <div className="w-[420px] border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-bold">Alert Details</h2>
                <button
                    onClick={onClose}
                    aria-label="Close details"
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                    <XCircle size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Title & Severity */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            severityConfig[alert.severity].color
                        )}>
                            {severityConfig[alert.severity].label}
                        </span>
                        {alert.silenced && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                                <VolumeX size={10} />
                                Silenced
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold">{alert.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{alert.summary}</p>
                </div>

                {/* Timing */}
                <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Started</span>
                        <span>{new Date(alert.startsAt).toLocaleString()}</span>
                    </div>
                    {alert.endsAt && (
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Resolved</span>
                            <span>{new Date(alert.endsAt).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{getRelativeTime(new Date(alert.startsAt))}</span>
                    </div>
                </div>

                {/* Labels */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Labels</h4>
                    <div className="space-y-1">
                        {Object.entries(alert.labels).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground">{key}</span>
                                <span className="font-mono">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Annotations */}
                {Object.keys(alert.annotations).length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Annotations</h4>
                        <div className="space-y-1">
                            {Object.entries(alert.annotations).map(([key, value]) => (
                                <div key={key} className="p-2 bg-muted/30 rounded">
                                    <span className="text-xs text-muted-foreground">{key}</span>
                                    <p className="text-sm mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Source */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Source</h4>
                    <div className="p-2 bg-muted/30 rounded text-sm">
                        <span className="text-muted-foreground">Data Source: </span>
                        <span className="font-mono">{alert.source}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
                    <VolumeX size={16} />
                    Silence
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    <Eye size={16} />
                    View Rule
                </button>
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
