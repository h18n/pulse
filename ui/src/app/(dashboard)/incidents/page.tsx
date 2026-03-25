"use client";

import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    Plus,
    ChevronRight,
    Users,
    MessageSquare,
    Link2,
    ExternalLink,
    MoreVertical,
    Bell,
    Flame,
    Activity,
    Calendar,
    User,
    Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IncidentSeverity = 'critical' | 'major' | 'minor' | 'warning';
type IncidentStatus = 'triggered' | 'acknowledged' | 'resolved';

interface Incident {
    id: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    service: string;
    assignee?: { name: string; avatar?: string };
    createdAt: string;
    updatedAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    alertCount: number;
    impactedServices: string[];
    timeline: { time: string; event: string; user?: string }[];
}

const MOCK_INCIDENTS: Incident[] = [
    {
        id: 'INC-001',
        title: 'Database Connection Failures',
        description: 'Multiple services experiencing database connection timeouts affecting user transactions.',
        severity: 'critical',
        status: 'triggered',
        service: 'PostgreSQL Primary',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        alertCount: 12,
        impactedServices: ['checkout-service', 'user-service', 'inventory-service'],
        timeline: [
            { time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), event: 'Incident created from alert' },
            { time: new Date(Date.now() - 1000 * 60 * 25).toISOString(), event: 'More alerts added', user: 'System' },
            { time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), event: 'Page sent to on-call', user: 'System' },
        ],
    },
    {
        id: 'INC-002',
        title: 'High API Latency in Checkout Flow',
        description: 'P95 latency exceeds 2s for checkout endpoints causing cart abandonments.',
        severity: 'major',
        status: 'acknowledged',
        service: 'checkout-service',
        assignee: { name: 'John Doe' },
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
        alertCount: 5,
        impactedServices: ['checkout-service', 'payment-gateway'],
        timeline: [
            { time: new Date(Date.now() - 1000 * 60 * 90).toISOString(), event: 'Incident created' },
            { time: new Date(Date.now() - 1000 * 60 * 80).toISOString(), event: 'Acknowledged', user: 'John Doe' },
            { time: new Date(Date.now() - 1000 * 60 * 60).toISOString(), event: 'Investigation started', user: 'John Doe' },
        ],
    },
    {
        id: 'INC-003',
        title: 'Memory Exhaustion on Worker Nodes',
        description: 'Kubernetes worker nodes experiencing OOM kills affecting batch processing.',
        severity: 'major',
        status: 'acknowledged',
        service: 'k8s-workers',
        assignee: { name: 'Jane Smith' },
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        alertCount: 8,
        impactedServices: ['batch-processor', 'data-pipeline'],
        timeline: [],
    },
    {
        id: 'INC-004',
        title: 'SSL Certificate Expiration Warning',
        description: 'SSL certificate for api.example.com expires in 7 days.',
        severity: 'warning',
        status: 'acknowledged',
        service: 'api-gateway',
        assignee: { name: 'Security Team' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        alertCount: 1,
        impactedServices: ['api-gateway'],
        timeline: [],
    },
    {
        id: 'INC-005',
        title: 'CDN Cache Hit Rate Drop',
        description: 'Cache hit rate dropped below 80% causing origin overload.',
        severity: 'minor',
        status: 'resolved',
        service: 'CDN',
        assignee: { name: 'Platform Team' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        alertCount: 3,
        impactedServices: ['cdn', 'static-assets'],
        timeline: [],
    },
];

export default function IncidentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

    const filteredIncidents = useMemo(() => {
        return MOCK_INCIDENTS.filter(incident => {
            const matchesSearch =
                incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                incident.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    const stats = useMemo(() => ({
        total: MOCK_INCIDENTS.length,
        triggered: MOCK_INCIDENTS.filter(i => i.status === 'triggered').length,
        acknowledged: MOCK_INCIDENTS.filter(i => i.status === 'acknowledged').length,
        resolved: MOCK_INCIDENTS.filter(i => i.status === 'resolved').length,
        critical: MOCK_INCIDENTS.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
    }), []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                            <Flame size={20} className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Incidents</h1>
                            <p className="text-sm text-muted-foreground">
                                Track and manage active incidents
                            </p>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                        <Plus size={16} />
                        Declare Incident
                    </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <StatButton
                        icon={<Flame size={14} />}
                        label="Triggered"
                        count={stats.triggered}
                        color="text-red-500 bg-red-500/10"
                        active={statusFilter === 'triggered'}
                        onClick={() => setStatusFilter(statusFilter === 'triggered' ? 'all' : 'triggered')}
                    />
                    <StatButton
                        icon={<Clock size={14} />}
                        label="Acknowledged"
                        count={stats.acknowledged}
                        color="text-amber-500 bg-amber-500/10"
                        active={statusFilter === 'acknowledged'}
                        onClick={() => setStatusFilter(statusFilter === 'acknowledged' ? 'all' : 'acknowledged')}
                    />
                    <StatButton
                        icon={<CheckCircle2 size={14} />}
                        label="Resolved"
                        count={stats.resolved}
                        color="text-emerald-500 bg-emerald-500/10"
                        active={statusFilter === 'resolved'}
                        onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
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
                        placeholder="Search incidents..."
                        className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Incident List */}
                <div className="flex-1 overflow-auto">
                    <div className="divide-y divide-border">
                        {filteredIncidents.map(incident => (
                            <IncidentRow
                                key={incident.id}
                                incident={incident}
                                isSelected={selectedIncident?.id === incident.id}
                                onClick={() => setSelectedIncident(incident)}
                            />
                        ))}

                        {filteredIncidents.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                                <h3 className="text-lg font-medium mb-1">No incidents found</h3>
                                <p className="text-sm text-muted-foreground">
                                    All systems are operating normally
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Incident Detail Sidebar */}
                {selectedIncident && (
                    <IncidentDetailSidebar
                        incident={selectedIncident}
                        onClose={() => setSelectedIncident(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ============== Components ==============

interface StatButtonProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    color: string;
    active?: boolean;
    onClick: () => void;
}

function StatButton({ icon, label, count, color, active, onClick }: StatButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                color,
                active && "ring-2 ring-current ring-offset-2 ring-offset-background"
            )}
        >
            {icon}
            <span className="font-medium">{count}</span>
            <span className="text-muted-foreground">{label}</span>
        </button>
    );
}

interface IncidentRowProps {
    incident: Incident;
    isSelected: boolean;
    onClick: () => void;
}

function IncidentRow({ incident, isSelected, onClick }: IncidentRowProps) {
    const severityConfig = {
        critical: { color: 'bg-red-500', text: 'text-red-500', label: 'Critical' },
        major: { color: 'bg-orange-500', text: 'text-orange-500', label: 'Major' },
        minor: { color: 'bg-amber-500', text: 'text-amber-500', label: 'Minor' },
        warning: { color: 'bg-blue-500', text: 'text-blue-500', label: 'Warning' },
    };

    const statusConfig = {
        triggered: { color: 'bg-red-500', label: 'Triggered' },
        acknowledged: { color: 'bg-amber-500', label: 'Acknowledged' },
        resolved: { color: 'bg-emerald-500', label: 'Resolved' },
    };

    const severity = severityConfig[incident.severity];
    const status = statusConfig[incident.status];
    const duration = getRelativeTime(new Date(incident.createdAt));

    return (
        <div
            onClick={onClick}
            data-testid="incident-row"
            className={cn(
                "flex items-center gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors",
                isSelected && "bg-primary/5 border-l-2 border-l-primary"
            )}
        >
            {/* Severity */}
            <div className={cn("w-1 h-12 rounded-full shrink-0", severity.color)} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{incident.id}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                        status.color
                    )}>
                        {status.label}
                    </span>
                </div>
                <h3 className="font-medium truncate mb-1" data-testid="incident-title">{incident.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Activity size={12} />
                        {incident.service}
                    </span>
                    <span className="flex items-center gap-1">
                        <Bell size={12} />
                        {incident.alertCount} alerts
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {duration}
                    </span>
                </div>
            </div>

            {/* Assignee */}
            {incident.assignee && (
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={12} className="text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{incident.assignee.name}</span>
                </div>
            )}

            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </div>
    );
}

interface IncidentDetailSidebarProps {
    incident: Incident;
    onClose: () => void;
}

function IncidentDetailSidebar({ incident, onClose }: IncidentDetailSidebarProps) {
    const severityConfig = {
        critical: { color: 'bg-red-500/10 text-red-500', label: 'Critical' },
        major: { color: 'bg-orange-500/10 text-orange-500', label: 'Major' },
        minor: { color: 'bg-amber-500/10 text-amber-500', label: 'Minor' },
        warning: { color: 'bg-blue-500/10 text-blue-500', label: 'Warning' },
    };

    const statusConfig = {
        triggered: { color: 'bg-red-500', label: 'Triggered' },
        acknowledged: { color: 'bg-amber-500', label: 'Acknowledged' },
        resolved: { color: 'bg-emerald-500', label: 'Resolved' },
    };

    return (
        <div className="w-[420px] border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{incident.id}</span>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                    <XCircle size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            severityConfig[incident.severity].color
                        )}>
                            {severityConfig[incident.severity].label}
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                            statusConfig[incident.status].color
                        )}>
                            {statusConfig[incident.status].label}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold">{incident.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2">{incident.description}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{getRelativeTime(new Date(incident.createdAt))}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Related Alerts</p>
                        <p className="font-medium">{incident.alertCount}</p>
                    </div>
                </div>

                {/* Assignee */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Assignee</h4>
                    {incident.assignee ? (
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User size={14} className="text-primary" />
                            </div>
                            <span className="text-sm">{incident.assignee.name}</span>
                        </div>
                    ) : (
                        <button className="w-full p-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                            + Assign responder
                        </button>
                    )}
                </div>

                {/* Impacted Services */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Impacted Services</h4>
                    <div className="flex flex-wrap gap-2">
                        {incident.impactedServices.map(service => (
                            <span key={service} className="px-2 py-1 bg-muted rounded text-xs">
                                {service}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                {incident.timeline.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3">Timeline</h4>
                        <div className="space-y-3">
                            {incident.timeline.map((entry, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm">{entry.event}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(entry.time).toLocaleTimeString()}
                                            {entry.user && ` • ${entry.user}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-2">
                {incident.status === 'triggered' && (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:opacity-90">
                        <Clock size={14} />
                        Acknowledge
                    </button>
                )}
                {incident.status !== 'resolved' && (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90">
                        <CheckCircle2 size={14} />
                        Resolve
                    </button>
                )}
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <MessageSquare size={16} className="text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}

// Helper
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
