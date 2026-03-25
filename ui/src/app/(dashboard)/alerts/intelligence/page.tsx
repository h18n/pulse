"use client";

import React, { useState, useMemo } from 'react';
import {
    Brain,
    Filter,
    Bell,
    BellOff,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    Zap,
    ArrowRight,
    Sparkles,
    Volume2,
    VolumeX,
    Group,
    Layers,
    Settings,
    Clock,
    Target,
    Shield,
    Flame,
    Eye,
    ThumbsUp,
    ThumbsDown,
    ChevronDown,
    ChevronRight,
    MessageSquare,
    Gauge,
    Activity,
    BarChart3,
    Hash,
    Minus,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============== Types ==============

type AlertDecision = 'send' | 'suppress' | 'group' | 'defer';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface ProcessedAlert {
    id: string;
    name: string;
    summary: string;
    severity: AlertSeverity;
    source: string;
    timestamp: string;
    decision: AlertDecision;
    confidence: number; // 0-100
    reasoning: string;
    relatedAlerts?: string[];
    groupId?: string;
    routedTo?: string;
    labels: Record<string, string>;
}

interface AlertGroup {
    id: string;
    name: string;
    alerts: ProcessedAlert[];
    rootCause: string;
    severity: AlertSeverity;
    timestamp: string;
}

interface FilterStats {
    totalProcessed: number;
    sent: number;
    suppressed: number;
    grouped: number;
    deferred: number;
    noiseReduction: number;
}

// ============== Mock Data ==============

const MOCK_STATS: FilterStats = {
    totalProcessed: 1247,
    sent: 89,
    suppressed: 847,
    grouped: 234,
    deferred: 77,
    noiseReduction: 92.9,
};

const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    total: Math.floor(Math.random() * 80) + 20,
    suppressed: Math.floor(Math.random() * 60) + 10,
    sent: Math.floor(Math.random() * 15) + 2,
}));

const MOCK_GROUPS: AlertGroup[] = [
    {
        id: 'grp-1',
        name: 'Database Connection Pool Exhaustion',
        severity: 'critical',
        rootCause: 'Connection pool on prod-db-01 reached 92% capacity, triggering cascading alerts across dependent services.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        alerts: [
            {
                id: 'a1', name: 'HighDBConnections', summary: 'Connection pool at 92%  on prod-db-01',
                severity: 'critical', source: 'prometheus', decision: 'send', confidence: 97,
                reasoning: 'Primary indicator of connection pool exhaustion. High severity, direct infrastructure impact.',
                timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                routedTo: '#alerts-dba', labels: { instance: 'prod-db-01', job: 'postgres' }, groupId: 'grp-1',
            },
            {
                id: 'a2', name: 'SlowQueries', summary: 'P95 query latency exceeded 500ms',
                severity: 'warning', source: 'prometheus', decision: 'group', confidence: 91,
                reasoning: 'Symptom of connection pool saturation. Grouped with parent alert to avoid duplicates.',
                timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
                labels: { instance: 'prod-db-01', job: 'postgres' }, groupId: 'grp-1',
            },
            {
                id: 'a3', name: 'APILatencyHigh', summary: 'API P99 latency above 2s',
                severity: 'warning', source: 'prometheus', decision: 'group', confidence: 88,
                reasoning: 'Downstream effect of database slowdown. Correlated with DB connection alerts.',
                timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
                labels: { service: 'api-gateway', environment: 'production' }, groupId: 'grp-1',
            },
            {
                id: 'a4', name: 'CheckoutErrors', summary: 'Checkout error rate above 3%',
                severity: 'warning', source: 'prometheus', decision: 'group', confidence: 82,
                reasoning: 'Business-impacting downstream effect. Grouped under DB root cause.',
                timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                labels: { service: 'checkout', environment: 'production' }, groupId: 'grp-1',
            },
        ],
    },
    {
        id: 'grp-2',
        name: 'Certificate Expiry Warnings',
        severity: 'info',
        rootCause: 'Multiple SSL certificates approaching expiry within 14 days. Non-urgent but requires planned action.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        alerts: [
            {
                id: 'a5', name: 'CertExpiry-api', summary: 'SSL cert for api.example.com expires in 12 days',
                severity: 'info', source: 'blackbox', decision: 'defer', confidence: 95,
                reasoning: 'Non-critical, scheduled maintenance item. Deferred to next business day digest.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                labels: { domain: 'api.example.com' }, groupId: 'grp-2',
            },
            {
                id: 'a6', name: 'CertExpiry-docs', summary: 'SSL cert for docs.example.com expires in 11 days',
                severity: 'info', source: 'blackbox', decision: 'defer', confidence: 95,
                reasoning: 'Non-critical, grouped with other certificate alerts for batched notification.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                labels: { domain: 'docs.example.com' }, groupId: 'grp-2',
            },
        ],
    },
];

const MOCK_PROCESSED: ProcessedAlert[] = [
    {
        id: 'p1', name: 'ContainerRestart', summary: 'Container restarted in pod payment-worker-5f8d9',
        severity: 'warning', source: 'kubernetes', decision: 'suppress', confidence: 94,
        reasoning: 'Single container restart within normal OOMKill recovery pattern. No sustained restarts detected in 30-minute window.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        labels: { pod: 'payment-worker-5f8d9', namespace: 'production' },
    },
    {
        id: 'p2', name: 'HighCPU-staging', summary: 'CPU usage 91% on staging-worker-01',
        severity: 'critical', source: 'prometheus', decision: 'suppress', confidence: 89,
        reasoning: 'Alert source is staging environment. Staging alerts are configured as informational only during business hours.',
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        labels: { instance: 'staging-worker-01', environment: 'staging' },
    },
    {
        id: 'p3', name: 'DiskUsageWarning', summary: 'Disk usage at 78% on log-collector-02',
        severity: 'warning', source: 'prometheus', decision: 'suppress', confidence: 92,
        reasoning: 'Below configured threshold of 85%. Automated log rotation is scheduled in 2 hours. Historical trend shows daily cycle.',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        labels: { instance: 'log-collector-02', job: 'node' },
    },
    {
        id: 'p4', name: 'ServiceDown', summary: 'API Gateway not responding',
        severity: 'critical', source: 'blackbox', decision: 'send', confidence: 98,
        reasoning: 'Critical service failure confirmed by 3 consecutive probe failures. No maintenance window active. Immediate action required.',
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        routedTo: '#alerts-critical + PagerDuty',
        labels: { service: 'api-gateway', environment: 'production' },
    },
    {
        id: 'p5', name: 'MemoryPressure', summary: 'Memory usage 87% on prod-app-03',
        severity: 'warning', source: 'prometheus', decision: 'send', confidence: 86,
        reasoning: 'Memory trending upward for 2 hours. No correlated deployment. Possible memory leak requires investigation.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        routedTo: '#alerts-infrastructure',
        labels: { instance: 'prod-app-03', job: 'node' },
    },
    {
        id: 'p6', name: 'PodEviction', summary: 'Pod evicted due to resource pressure',
        severity: 'warning', source: 'kubernetes', decision: 'suppress', confidence: 91,
        reasoning: 'Low-priority batch job pod. Eviction is expected behavior under resource contention. Job will auto-retry.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        labels: { pod: 'batch-processor-abc12', namespace: 'jobs' },
    },
    {
        id: 'p7', name: 'HighErrorRate', summary: 'Error rate 2.1% on search-service',
        severity: 'warning', source: 'prometheus', decision: 'defer', confidence: 78,
        reasoning: 'Slightly elevated error rate. Partially correlated with a deployment 20 minutes ago. Monitoring for stabilization before alerting.',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        labels: { service: 'search-service', environment: 'production' },
    },
    {
        id: 'p8', name: 'NetworkLatency', summary: 'Inter-AZ latency spike to 15ms',
        severity: 'info', source: 'prometheus', decision: 'suppress', confidence: 96,
        reasoning: 'Within acceptable range for cross-AZ communication. No impact on SLOs detected. Regular fluctuation pattern.',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        labels: { region: 'us-east-1', type: 'cross-az' },
    },
];

// ============== Sensitivity Config ==============

interface SensitivityConfig {
    level: 'low' | 'medium' | 'high';
    suppressStaging: boolean;
    groupCorrelated: boolean;
    deferInfoAlerts: boolean;
    noiseThreshold: number;
}

// ============== Main Component ==============

export default function AlertIntelligencePage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'stream' | 'groups' | 'settings'>('overview');
    const [sensitivity, setSensitivity] = useState<SensitivityConfig>({
        level: 'medium',
        suppressStaging: true,
        groupCorrelated: true,
        deferInfoAlerts: true,
        noiseThreshold: 80,
    });

    const allAlerts = useMemo(() => {
        return [...MOCK_PROCESSED, ...MOCK_GROUPS.flatMap(g => g.alerts)];
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Alert Intelligence</h1>
                            <p className="text-sm text-muted-foreground">
                                AI-powered noise reduction &amp; smart routing
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg text-sm">
                            <TrendingDown size={14} className="text-emerald-500" />
                            <span className="text-emerald-500 font-bold">{MOCK_STATS.noiseReduction}%</span>
                            <span className="text-muted-foreground">noise reduced</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
                            <Hash size={14} className="text-muted-foreground" />
                            <span className="font-medium">{MOCK_STATS.totalProcessed}</span>
                            <span className="text-muted-foreground">processed today</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'stream', label: 'Decision Stream', icon: Activity },
                        { id: 'groups', label: 'Smart Groups', icon: Layers },
                        { id: 'settings', label: 'Configuration', icon: Settings },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'overview' && <OverviewTab stats={MOCK_STATS} hourlyData={HOURLY_DATA} />}
                {activeTab === 'stream' && <DecisionStreamTab alerts={allAlerts} />}
                {activeTab === 'groups' && <SmartGroupsTab groups={MOCK_GROUPS} />}
                {activeTab === 'settings' && <SettingsTab config={sensitivity} onChange={setSensitivity} />}
            </div>
        </div>
    );
}

// ============== Overview Tab ==============

function OverviewTab({ stats, hourlyData }: { stats: FilterStats; hourlyData: typeof HOURLY_DATA }) {
    const maxTotal = Math.max(...hourlyData.map(d => d.total));

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Alerts Sent"
                    value={stats.sent}
                    icon={<Bell size={18} />}
                    color="text-primary bg-primary/10"
                    subtitle="Actionable alerts delivered"
                />
                <StatCard
                    label="Suppressed"
                    value={stats.suppressed}
                    icon={<VolumeX size={18} />}
                    color="text-emerald-500 bg-emerald-500/10"
                    subtitle="Non-actionable filtered out"
                />
                <StatCard
                    label="Grouped"
                    value={stats.grouped}
                    icon={<Layers size={18} />}
                    color="text-violet-500 bg-violet-500/10"
                    subtitle="Correlated into clusters"
                />
                <StatCard
                    label="Deferred"
                    value={stats.deferred}
                    icon={<Clock size={18} />}
                    color="text-amber-500 bg-amber-500/10"
                    subtitle="Queued for digest"
                />
            </div>

            {/* Noise Reduction Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold">Alert Volume (24h)</h3>
                        <p className="text-sm text-muted-foreground">Raw alerts vs sent notifications</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-muted-foreground/20" />
                            Total
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-red-500/40" />
                            Suppressed
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-primary" />
                            Sent
                        </span>
                    </div>
                </div>
                <div className="flex items-end gap-1 h-40">
                    {hourlyData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                            <div className="w-full flex flex-col-reverse" style={{ height: '140px' }}>
                                <div
                                    className="w-full bg-primary rounded-t transition-all"
                                    style={{ height: `${(d.sent / maxTotal) * 100}%` }}
                                />
                                <div
                                    className="w-full bg-red-500/30 transition-all"
                                    style={{ height: `${(d.suppressed / maxTotal) * 100}%` }}
                                />
                                <div
                                    className="w-full bg-muted-foreground/10 transition-all"
                                    style={{ height: `${((d.total - d.sent - d.suppressed) / maxTotal) * 100}%` }}
                                />
                            </div>
                            {i % 4 === 0 && (
                                <span className="text-[9px] text-muted-foreground">{d.hour}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-4">How Alert Intelligence Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            step: '1',
                            title: 'Ingest',
                            description: 'All firing alerts enter the pipeline',
                            icon: <Zap size={16} />,
                            color: 'text-blue-500 bg-blue-500/10',
                        },
                        {
                            step: '2',
                            title: 'Analyze',
                            description: 'LLM evaluates severity, context, and history',
                            icon: <Brain size={16} />,
                            color: 'text-violet-500 bg-violet-500/10',
                        },
                        {
                            step: '3',
                            title: 'Correlate',
                            description: 'Related alerts are grouped by root cause',
                            icon: <Layers size={16} />,
                            color: 'text-amber-500 bg-amber-500/10',
                        },
                        {
                            step: '4',
                            title: 'Route',
                            description: 'Actionable alerts are delivered to the right channel',
                            icon: <ArrowRight size={16} />,
                            color: 'text-emerald-500 bg-emerald-500/10',
                        },
                    ].map(item => (
                        <div key={item.step} className="relative p-4 bg-muted/30 rounded-xl">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", item.color)}>
                                {item.icon}
                            </div>
                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <span className="absolute top-3 right-3 text-xs font-mono text-muted-foreground/50">{item.step}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Suppressions */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-4">Top Suppression Reasons</h3>
                <div className="space-y-3">
                    {[
                        { reason: 'Staging environment alerts during business hours', count: 312, percent: 37 },
                        { reason: 'Single container restart within recovery pattern', count: 198, percent: 23 },
                        { reason: 'Metric value below actionable threshold', count: 156, percent: 18 },
                        { reason: 'Known maintenance window active', count: 98, percent: 12 },
                        { reason: 'Duplicate of existing incident', count: 83, percent: 10 },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground w-8 text-right">{i + 1}.</span>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">{item.reason}</span>
                                    <span className="text-xs text-muted-foreground">{item.count} alerts</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500/60 rounded-full"
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color, subtitle }: {
    label: string; value: number; icon: React.ReactNode; color: string; subtitle: string;
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-sm font-medium mt-0.5">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
    );
}

// ============== Decision Stream Tab ==============

function DecisionStreamTab({ alerts }: { alerts: ProcessedAlert[] }) {
    const [filterDecision, setFilterDecision] = useState<AlertDecision | 'all'>('all');

    const filtered = useMemo(() => {
        const sorted = [...alerts].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        if (filterDecision === 'all') return sorted;
        return sorted.filter(a => a.decision === filterDecision);
    }, [alerts, filterDecision]);

    const decisionConfig: Record<AlertDecision, { icon: React.ReactNode; label: string; color: string }> = {
        send: { icon: <Bell size={12} />, label: 'Sent', color: 'text-primary bg-primary/10' },
        suppress: { icon: <VolumeX size={12} />, label: 'Suppressed', color: 'text-emerald-500 bg-emerald-500/10' },
        group: { icon: <Layers size={12} />, label: 'Grouped', color: 'text-violet-500 bg-violet-500/10' },
        defer: { icon: <Clock size={12} />, label: 'Deferred', color: 'text-amber-500 bg-amber-500/10' },
    };

    return (
        <div className="max-w-4xl space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                {(['all', 'send', 'suppress', 'group', 'defer'] as const).map(d => (
                    <button
                        key={d}
                        onClick={() => setFilterDecision(d)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            filterDecision === d
                                ? (d === 'all' ? "bg-primary/10 text-primary" : decisionConfig[d as AlertDecision].color)
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {d === 'all' ? 'All' : decisionConfig[d].label}
                    </button>
                ))}
            </div>

            {/* Alert list */}
            <div className="space-y-3">
                {filtered.map(alert => {
                    const config = decisionConfig[alert.decision];
                    return (
                        <AlertDecisionCard key={alert.id} alert={alert} config={config} />
                    );
                })}
            </div>
        </div>
    );
}

function AlertDecisionCard({ alert, config }: {
    alert: ProcessedAlert;
    config: { icon: React.ReactNode; label: string; color: string };
}) {
    const [expanded, setExpanded] = useState(false);

    const severityConfig = {
        critical: { color: 'bg-red-500', text: 'text-red-500' },
        warning: { color: 'bg-amber-500', text: 'text-amber-500' },
        info: { color: 'bg-blue-500', text: 'text-blue-500' },
    };

    const sev = severityConfig[alert.severity];

    return (
        <div className="bg-card border border-border rounded-xl transition-all hover:border-border/80">
            <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    {/* Severity bar */}
                    <div className={cn("w-1 h-12 rounded-full shrink-0", sev.color)} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-sm">{alert.name}</h3>
                            <span className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                config.color
                            )}>
                                {config.icon}
                                {config.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {Math.round(alert.confidence)}% confidence
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{alert.summary}</p>
                    </div>

                    {/* Route + Time */}
                    <div className="text-right shrink-0">
                        {alert.routedTo && (
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                → {alert.routedTo}
                            </span>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {getRelativeTime(new Date(alert.timestamp))}
                        </p>
                    </div>

                    <button className="p-1 shrink-0">
                        {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                    </button>
                </div>
            </div>

            {/* Expanded reasoning */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 ml-8">
                    <div className="flex items-start gap-2 mb-3">
                        <Sparkles size={14} className="text-violet-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-medium text-violet-500 mb-1">AI Reasoning</p>
                            <p className="text-sm text-muted-foreground">{alert.reasoning}</p>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(alert.labels).map(([k, v]) => (
                            <span key={k} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                {k}={v}
                            </span>
                        ))}
                    </div>

                    {/* Feedback */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">Was this decision correct?</span>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 transition-colors">
                            <ThumbsUp size={12} />
                            Yes
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                            <ThumbsDown size={12} />
                            No
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============== Smart Groups Tab ==============

function SmartGroupsTab({ groups }: { groups: AlertGroup[] }) {
    return (
        <div className="max-w-4xl space-y-4">
            {groups.map(group => (
                <GroupCard key={group.id} group={group} />
            ))}
        </div>
    );
}

function GroupCard({ group }: { group: AlertGroup }) {
    const [expanded, setExpanded] = useState(true);

    const severityConfig = {
        critical: { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10' },
        warning: { color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
        info: { color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10' },
    };

    const sev = severityConfig[group.severity];

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className="px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", sev.bg, sev.text)}>
                        <Layers size={18} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm">{group.name}</h3>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                {group.alerts.length} alerts
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{group.rootCause}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {getRelativeTime(new Date(group.timestamp))}
                        </span>
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                </div>
            </div>

            {/* Grouped alerts */}
            {expanded && (
                <div className="border-t border-border">
                    {group.alerts.map((alert, idx) => {
                        const isRoot = idx === 0;
                        return (
                            <div
                                key={alert.id}
                                className={cn(
                                    "px-5 py-3 flex items-center gap-3 border-b border-border/50 last:border-b-0",
                                    isRoot && "bg-primary/5"
                                )}
                            >
                                <div className="w-6 flex justify-center">
                                    {isRoot ? (
                                        <Target size={14} className="text-primary" />
                                    ) : (
                                        <div className="w-px h-6 bg-border" />
                                    )}
                                </div>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    severityConfig[alert.severity].color
                                )} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium">{alert.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{alert.summary}</span>
                                </div>
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                                    alert.decision === 'send' ? "text-primary bg-primary/10" :
                                    alert.decision === 'group' ? "text-violet-500 bg-violet-500/10" :
                                    "text-amber-500 bg-amber-500/10"
                                )}>
                                    {isRoot ? 'Root Cause → Sent' : alert.decision === 'group' ? 'Grouped' : 'Deferred'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============== Settings Tab ==============

function SettingsTab({ config, onChange }: { config: SensitivityConfig; onChange: (c: SensitivityConfig) => void }) {
    return (
        <div className="max-w-2xl space-y-6">
            {/* Sensitivity Level */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-1">Sensitivity Level</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Higher sensitivity means fewer alerts are suppressed
                </p>
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { id: 'low', label: 'Low', desc: 'Aggressive filtering. Only critical production alerts pass through.', icon: Shield },
                        { id: 'medium', label: 'Medium', desc: 'Balanced filtering. Most noise removed while keeping important signals.', icon: Gauge },
                        { id: 'high', label: 'High', desc: 'Conservative filtering. Only obviously redundant alerts suppressed.', icon: Eye },
                    ] as const).map(level => (
                        <button
                            key={level.id}
                            onClick={() => onChange({ ...config, level: level.id })}
                            className={cn(
                                "p-4 rounded-xl border text-left transition-all",
                                config.level === level.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                    : "border-border hover:border-primary/30"
                            )}
                        >
                            <level.icon size={18} className={cn(
                                "mb-2",
                                config.level === level.id ? "text-primary" : "text-muted-foreground"
                            )} />
                            <h4 className="font-medium text-sm">{level.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{level.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter Rules */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-1">Filter Rules</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Toggle individual filtering behaviors
                </p>
                <div className="space-y-4">
                    <ToggleRow
                        label="Suppress staging environment alerts"
                        description="Automatically filter alerts from non-production environments during business hours"
                        enabled={config.suppressStaging}
                        onToggle={() => onChange({ ...config, suppressStaging: !config.suppressStaging })}
                    />
                    <ToggleRow
                        label="Group correlated alerts"
                        description="Cluster related alerts by root cause and send a single notification"
                        enabled={config.groupCorrelated}
                        onToggle={() => onChange({ ...config, groupCorrelated: !config.groupCorrelated })}
                    />
                    <ToggleRow
                        label="Defer informational alerts"
                        description="Queue non-critical informational alerts for a daily digest instead of immediate delivery"
                        enabled={config.deferInfoAlerts}
                        onToggle={() => onChange({ ...config, deferInfoAlerts: !config.deferInfoAlerts })}
                    />
                </div>
            </div>

            {/* Noise Threshold */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-1">Confidence Threshold</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Minimum AI confidence required to suppress an alert. Alerts below this threshold are always sent.
                </p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Threshold</span>
                        <span className="text-sm font-bold text-primary">{config.noiseThreshold}%</span>
                    </div>
                    <input
                        type="range"
                        min={50}
                        max={99}
                        value={config.noiseThreshold}
                        onChange={(e) => onChange({ ...config, noiseThreshold: parseInt(e.target.value) })}
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50% (aggressive)</span>
                        <span>99% (conservative)</span>
                    </div>
                </div>
            </div>

            {/* Routing Rules */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-1">Smart Routing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    AI automatically routes alerts to the best channel based on content
                </p>
                <div className="space-y-2">
                    {[
                        { pattern: 'Database / PostgreSQL alerts', channel: '#alerts-dba', color: 'text-amber-500' },
                        { pattern: 'Kubernetes / Pod alerts', channel: '#alerts-platform', color: 'text-blue-500' },
                        { pattern: 'Critical severity (any)', channel: 'PagerDuty → On-call', color: 'text-red-500' },
                        { pattern: 'Security / Auth alerts', channel: '#alerts-security', color: 'text-violet-500' },
                        { pattern: 'All other alerts', channel: '#alerts-general', color: 'text-muted-foreground' },
                    ].map((rule, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <ArrowRight size={14} className={rule.color} />
                            <span className="flex-1 text-sm">{rule.pattern}</span>
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {rule.channel}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ label, description, enabled, onToggle }: {
    label: string; description: string; enabled: boolean; onToggle: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <h4 className="text-sm font-medium">{label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={cn(
                    "relative w-11 h-6 rounded-full transition-colors shrink-0",
                    enabled ? "bg-primary" : "bg-muted"
                )}
            >
                <span className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
                    enabled ? "translate-x-5" : "translate-x-0.5"
                )} />
            </button>
        </div>
    );
}

// ============== Helpers ==============

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
