"use client";

import React, { useState, useMemo } from 'react';
import {
    Target,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    Filter,
    BarChart3,
    Activity,
    Shield,
    Database,
    CreditCard,
    Layers,
    Link2,
    Server,
    ChevronRight,
    XCircle,
    Gauge,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    RefreshCw,
    Settings,
    History,
    Bell,
    Zap,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============== Types ==============

type SLOStatus = 'healthy' | 'at_risk' | 'breached';
type SLOCategory = 'core' | 'auth' | 'database' | 'payments' | 'jobs' | 'integrations' | 'infrastructure';

interface SLO {
    id: string;
    name: string;
    description: string;
    category: SLOCategory;
    target: number; // percentage, e.g., 99.9
    current: number; // current compliance percentage
    status: SLOStatus;
    errorBudget: {
        total: number; // total budget in minutes or percentage
        remaining: number; // remaining budget
        burnRate: number; // 1x = normal, >1 = burning fast
    };
    indicator: string; // e.g., "Successful API responses (2xx/3xx)"
    alertLinked: boolean;
    window: '7d' | '28d' | '30d' | '90d';
    history: { date: string; value: number }[];
    createdAt: string;
}

// ============== Mock Data ==============

const MOCK_SLOS: SLO[] = [
    {
        id: 'slo-1',
        name: 'API Availability',
        description: 'Successful API responses (2xx/3xx) across all endpoints',
        category: 'core',
        target: 99.9,
        current: 99.94,
        status: 'healthy',
        errorBudget: { total: 43.2, remaining: 38.7, burnRate: 0.4 },
        indicator: 'http_requests_total{status=~"2..|3.."}',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.9, 0.15),
        createdAt: '2026-01-01',
    },
    {
        id: 'slo-2',
        name: 'API Latency P99',
        description: 'P99 response time under 500ms for all API endpoints',
        category: 'core',
        target: 99.0,
        current: 98.7,
        status: 'at_risk',
        errorBudget: { total: 432, remaining: 89, burnRate: 2.3 },
        indicator: 'histogram_quantile(0.99, http_request_duration_seconds_bucket)',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.0, 0.8),
        createdAt: '2026-01-01',
    },
    {
        id: 'slo-3',
        name: 'Error Rate',
        description: 'Server errors (5xx) below 0.1% of total requests',
        category: 'core',
        target: 99.9,
        current: 99.97,
        status: 'healthy',
        errorBudget: { total: 43.2, remaining: 41.1, burnRate: 0.2 },
        indicator: '1 - (rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]))',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.9, 0.08),
        createdAt: '2026-01-01',
    },
    {
        id: 'slo-4',
        name: 'Auth Success Rate',
        description: 'Successful authentication attempts across all providers',
        category: 'auth',
        target: 99.5,
        current: 99.82,
        status: 'healthy',
        errorBudget: { total: 216, remaining: 197, burnRate: 0.3 },
        indicator: 'auth_attempts_total{result="success"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(99.5, 0.3),
        createdAt: '2026-01-05',
    },
    {
        id: 'slo-5',
        name: 'Token Validation',
        description: 'JWT/Session token validations succeed within SLA',
        category: 'auth',
        target: 99.9,
        current: 99.95,
        status: 'healthy',
        errorBudget: { total: 43.2, remaining: 40.8, burnRate: 0.2 },
        indicator: 'token_validation_total{result="valid"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(99.9, 0.06),
        createdAt: '2026-01-05',
    },
    {
        id: 'slo-6',
        name: 'Database Availability',
        description: 'Primary database accepts connections and responds to queries',
        category: 'database',
        target: 99.99,
        current: 99.98,
        status: 'at_risk',
        errorBudget: { total: 4.32, remaining: 0.9, burnRate: 3.1 },
        indicator: 'pg_up == 1',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.99, 0.02),
        createdAt: '2026-01-01',
    },
    {
        id: 'slo-7',
        name: 'DB Query Latency P95',
        description: 'Database query execution time under 100ms at P95',
        category: 'database',
        target: 99.0,
        current: 99.45,
        status: 'healthy',
        errorBudget: { total: 432, remaining: 349, burnRate: 0.7 },
        indicator: 'histogram_quantile(0.95, pg_query_duration_seconds_bucket)',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.0, 0.5),
        createdAt: '2026-01-01',
    },
    {
        id: 'slo-8',
        name: 'Connection Pool',
        description: 'Available database connections remain above 20% of pool capacity',
        category: 'database',
        target: 99.0,
        current: 97.2,
        status: 'breached',
        errorBudget: { total: 432, remaining: -78, burnRate: 4.8 },
        indicator: 'pg_stat_activity_count / pg_settings_max_connections < 0.8',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.0, 2.5),
        createdAt: '2026-01-01',
    },
    {
        id: 'slo-9',
        name: 'Payment Success',
        description: 'Successful payment processing across all providers',
        category: 'payments',
        target: 99.9,
        current: 99.92,
        status: 'healthy',
        errorBudget: { total: 43.2, remaining: 39.84, burnRate: 0.3 },
        indicator: 'payment_transactions_total{status="success"}',
        alertLinked: true,
        window: '30d',
        history: generateHistory(99.9, 0.1),
        createdAt: '2026-01-10',
    },
    {
        id: 'slo-10',
        name: 'Checkout Latency',
        description: 'Checkout flow end-to-end completion under 3 seconds',
        category: 'payments',
        target: 95.0,
        current: 96.3,
        status: 'healthy',
        errorBudget: { total: 2160, remaining: 1890, burnRate: 0.5 },
        indicator: 'checkout_duration_seconds_bucket{le="3"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(95.0, 1.5),
        createdAt: '2026-01-10',
    },
    {
        id: 'slo-11',
        name: 'Job Success Rate',
        description: 'Background job completions without failures',
        category: 'jobs',
        target: 99.5,
        current: 99.61,
        status: 'healthy',
        errorBudget: { total: 216, remaining: 189, burnRate: 0.5 },
        indicator: 'job_executions_total{status="completed"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(99.5, 0.3),
        createdAt: '2026-01-15',
    },
    {
        id: 'slo-12',
        name: 'Queue Latency',
        description: 'Job queue wait time under 30 seconds at P95',
        category: 'jobs',
        target: 95.0,
        current: 94.1,
        status: 'breached',
        errorBudget: { total: 2160, remaining: -194, burnRate: 3.2 },
        indicator: 'histogram_quantile(0.95, job_queue_wait_seconds_bucket)',
        alertLinked: true,
        window: '30d',
        history: generateHistory(95.0, 2.0),
        createdAt: '2026-01-15',
    },
    {
        id: 'slo-13',
        name: 'Webhook Delivery',
        description: 'Successful webhook deliveries to external endpoints',
        category: 'integrations',
        target: 99.0,
        current: 99.34,
        status: 'healthy',
        errorBudget: { total: 432, remaining: 391, burnRate: 0.4 },
        indicator: 'webhook_deliveries_total{status="delivered"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(99.0, 0.4),
        createdAt: '2026-01-20',
    },
    {
        id: 'slo-14',
        name: 'External API Calls',
        description: 'Third-party API integrations succeed within timeout',
        category: 'integrations',
        target: 98.0,
        current: 98.55,
        status: 'healthy',
        errorBudget: { total: 864, remaining: 746, burnRate: 0.5 },
        indicator: 'external_api_calls_total{status="success"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(98.0, 0.6),
        createdAt: '2026-01-20',
    },
    {
        id: 'slo-15',
        name: 'CDN Availability',
        description: 'Static asset delivery from CDN edge nodes',
        category: 'infrastructure',
        target: 99.95,
        current: 99.97,
        status: 'healthy',
        errorBudget: { total: 21.6, remaining: 19.3, burnRate: 0.4 },
        indicator: 'cdn_requests_total{status="hit"} + cdn_requests_total{status="miss"}',
        alertLinked: false,
        window: '30d',
        history: generateHistory(99.95, 0.04),
        createdAt: '2026-02-01',
    },
    {
        id: 'slo-16',
        name: 'Cache Hit Rate',
        description: 'Redis/Memcache hit ratio above 80% threshold',
        category: 'infrastructure',
        target: 95.0,
        current: 92.4,
        status: 'breached',
        errorBudget: { total: 2160, remaining: -562, burnRate: 5.1 },
        indicator: 'redis_keyspace_hits / (redis_keyspace_hits + redis_keyspace_misses)',
        alertLinked: true,
        window: '30d',
        history: generateHistory(95.0, 3.5),
        createdAt: '2026-02-01',
    },
];

function generateHistory(target: number, variance: number): { date: string; value: number }[] {
    const days = 30;
    const history = [];
    for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const noise = (Math.random() - 0.3) * variance;
        const value = Math.min(100, Math.max(target - variance * 2, target + noise));
        history.push({
            date: date.toISOString().split('T')[0],
            value: parseFloat(value.toFixed(3)),
        });
    }
    return history;
}

const CATEGORY_CONFIG: Record<SLOCategory, { label: string; icon: React.ReactNode; color: string }> = {
    core: { label: 'Core', icon: <Activity size={14} />, color: 'text-blue-500 bg-blue-500/10' },
    auth: { label: 'Auth', icon: <Shield size={14} />, color: 'text-violet-500 bg-violet-500/10' },
    database: { label: 'Database', icon: <Database size={14} />, color: 'text-amber-500 bg-amber-500/10' },
    payments: { label: 'Payments', icon: <CreditCard size={14} />, color: 'text-emerald-500 bg-emerald-500/10' },
    jobs: { label: 'Jobs', icon: <Layers size={14} />, color: 'text-orange-500 bg-orange-500/10' },
    integrations: { label: 'Integrations', icon: <Link2 size={14} />, color: 'text-pink-500 bg-pink-500/10' },
    infrastructure: { label: 'Infrastructure', icon: <Server size={14} />, color: 'text-cyan-500 bg-cyan-500/10' },
};

// ============== Main Component ==============

export default function SLOsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<SLOCategory | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<SLOStatus | 'all'>('all');
    const [selectedSLO, setSelectedSLO] = useState<SLO | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredSLOs = useMemo(() => {
        return MOCK_SLOS.filter(slo => {
            const matchesSearch =
                slo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                slo.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || slo.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' || slo.status === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [searchQuery, categoryFilter, statusFilter]);

    const stats = useMemo(() => ({
        total: MOCK_SLOS.length,
        healthy: MOCK_SLOS.filter(s => s.status === 'healthy').length,
        atRisk: MOCK_SLOS.filter(s => s.status === 'at_risk').length,
        breached: MOCK_SLOS.filter(s => s.status === 'breached').length,
        avgCompliance: parseFloat(
            (MOCK_SLOS.reduce((acc, s) => acc + s.current, 0) / MOCK_SLOS.length).toFixed(2)
        ),
    }), []);

    const groupedSLOs = useMemo(() => {
        if (categoryFilter !== 'all') return { [categoryFilter]: filteredSLOs };
        return filteredSLOs.reduce((acc, slo) => {
            if (!acc[slo.category]) acc[slo.category] = [];
            acc[slo.category].push(slo);
            return acc;
        }, {} as Record<string, SLO[]>);
    }, [filteredSLOs, categoryFilter]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Target size={20} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Service Level Objectives</h1>
                            <p className="text-sm text-muted-foreground">
                                Track reliability targets and error budgets
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
                            <Gauge size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground">Avg Compliance:</span>
                            <span className={cn(
                                "font-bold",
                                stats.avgCompliance >= 99 ? "text-emerald-500" :
                                stats.avgCompliance >= 95 ? "text-amber-500" : "text-red-500"
                            )}>
                                {stats.avgCompliance}%
                            </span>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            <Plus size={16} />
                            Create SLO
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <StatusBadge
                        icon={<CheckCircle2 size={14} />}
                        label="Healthy"
                        count={stats.healthy}
                        color="text-emerald-500 bg-emerald-500/10"
                        active={statusFilter === 'healthy'}
                        onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
                    />
                    <StatusBadge
                        icon={<AlertTriangle size={14} />}
                        label="At Risk"
                        count={stats.atRisk}
                        color="text-amber-500 bg-amber-500/10"
                        active={statusFilter === 'at_risk'}
                        onClick={() => setStatusFilter(statusFilter === 'at_risk' ? 'all' : 'at_risk')}
                    />
                    <StatusBadge
                        icon={<XCircle size={14} />}
                        label="Breached"
                        count={stats.breached}
                        color="text-red-500 bg-red-500/10"
                        active={statusFilter === 'breached'}
                        onClick={() => setStatusFilter(statusFilter === 'breached' ? 'all' : 'breached')}
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
                        placeholder="Search SLOs..."
                        className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    />
                </div>

                {/* Category filter pills */}
                <div className="hidden lg:flex items-center gap-2">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            categoryFilter === 'all'
                                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                    >
                        All
                    </button>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setCategoryFilter(categoryFilter === key as SLOCategory ? 'all' : key as SLOCategory)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                categoryFilter === key
                                    ? cn(config.color, "ring-1 ring-current/30")
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                        >
                            {config.icon}
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto p-6">
                    {Object.keys(groupedSLOs).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Target size={48} className="text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium mb-1">No SLOs found</h3>
                            <p className="text-sm text-muted-foreground">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedSLOs).map(([category, slos]) => {
                                const config = CATEGORY_CONFIG[category as SLOCategory];
                                return (
                                    <div key={category}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.color)}>
                                                {config.icon}
                                            </div>
                                            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                                {config.label}
                                            </h2>
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                {slos.length}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {slos.map(slo => (
                                                <SLOCard
                                                    key={slo.id}
                                                    slo={slo}
                                                    isSelected={selectedSLO?.id === slo.id}
                                                    onClick={() => setSelectedSLO(slo)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Detail Sidebar */}
                {selectedSLO && (
                    <SLODetailSidebar
                        slo={selectedSLO}
                        onClose={() => setSelectedSLO(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ============== Components ==============

function StatusBadge({ icon, label, count, color, active, onClick }: {
    icon: React.ReactNode;
    label: string;
    count: number;
    color: string;
    active?: boolean;
    onClick: () => void;
}) {
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

function SLOCard({ slo, isSelected, onClick }: { slo: SLO; isSelected: boolean; onClick: () => void }) {
    const budgetPercent = slo.errorBudget.total > 0
        ? Math.max(0, (slo.errorBudget.remaining / slo.errorBudget.total) * 100)
        : 0;

    const statusConfig = {
        healthy: { color: 'text-emerald-500', bg: 'bg-emerald-500', ringColor: 'ring-emerald-500/20', label: 'Healthy' },
        at_risk: { color: 'text-amber-500', bg: 'bg-amber-500', ringColor: 'ring-amber-500/20', label: 'At Risk' },
        breached: { color: 'text-red-500', bg: 'bg-red-500', ringColor: 'ring-red-500/20', label: 'Breached' },
    };

    const config = statusConfig[slo.status];

    const sparklinePoints = slo.history.slice(-14).map((h, i, arr) => {
        const min = Math.min(...arr.map(a => a.value));
        const max = Math.max(...arr.map(a => a.value));
        const range = max - min || 1;
        const x = (i / (arr.length - 1)) * 120;
        const y = 24 - ((h.value - min) / range) * 20;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/5",
                isSelected && cn("ring-2", config.ringColor, "border-transparent")
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{slo.name}</h3>
                        {slo.alertLinked && (
                            <Bell size={10} className="text-primary shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{slo.description}</p>
                </div>
                <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2",
                    config.color, `${config.bg}/10`
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", config.bg,
                        slo.status !== 'healthy' && "animate-pulse"
                    )} />
                    {config.label}
                </div>
            </div>

            {/* Compliance + Target */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <span className="text-2xl font-bold tracking-tight">{slo.current}%</span>
                    <span className="text-xs text-muted-foreground ml-1">/ {slo.target}%</span>
                </div>
                {/* Mini sparkline */}
                <svg width="120" height="24" className="text-muted-foreground/30">
                    <polyline
                        points={sparklinePoints}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={cn(
                            slo.status === 'healthy' && "text-emerald-500/50",
                            slo.status === 'at_risk' && "text-amber-500/50",
                            slo.status === 'breached' && "text-red-500/50",
                        )}
                    />
                    {/* Target line */}
                    <line x1="0" y1="12" x2="120" y2="12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
                </svg>
            </div>

            {/* Error Budget Bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Error Budget</span>
                    <div className="flex items-center gap-1.5">
                        {slo.errorBudget.burnRate > 1 && (
                            <span className={cn(
                                "flex items-center gap-0.5 text-xs font-medium",
                                slo.errorBudget.burnRate > 3 ? "text-red-500" : "text-amber-500"
                            )}>
                                <Flame size={10} />
                                {slo.errorBudget.burnRate}x
                            </span>
                        )}
                        <span className={cn(
                            "font-medium",
                            budgetPercent > 50 ? "text-emerald-500" :
                            budgetPercent > 20 ? "text-amber-500" : "text-red-500"
                        )}>
                            {budgetPercent.toFixed(0)}% remaining
                        </span>
                    </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            budgetPercent > 50 ? "bg-emerald-500" :
                            budgetPercent > 20 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(100, budgetPercent)}%` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{slo.window} window</span>
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}

function SLODetailSidebar({ slo, onClose }: { slo: SLO; onClose: () => void }) {
    const budgetPercent = slo.errorBudget.total > 0
        ? Math.max(0, (slo.errorBudget.remaining / slo.errorBudget.total) * 100)
        : 0;

    const statusConfig = {
        healthy: { color: 'text-emerald-500 bg-emerald-500/10', label: 'Healthy', icon: <CheckCircle2 size={14} /> },
        at_risk: { color: 'text-amber-500 bg-amber-500/10', label: 'At Risk', icon: <AlertTriangle size={14} /> },
        breached: { color: 'text-red-500 bg-red-500/10', label: 'Breached', icon: <XCircle size={14} /> },
    };

    const config = statusConfig[slo.status];
    const categoryConfig = CATEGORY_CONFIG[slo.category];

    // Build SVG path for history chart
    const historyData = slo.history;
    const chartWidth = 360;
    const chartHeight = 120;
    const padding = 4;
    const min = Math.min(...historyData.map(h => h.value));
    const max = Math.max(...historyData.map(h => h.value));
    const range = max - min || 1;

    const points = historyData.map((h, i) => {
        const x = padding + (i / (historyData.length - 1)) * (chartWidth - padding * 2);
        const y = padding + (1 - (h.value - min) / range) * (chartHeight - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    const targetY = padding + (1 - (slo.target - min) / range) * (chartHeight - padding * 2);

    const fillPoints = `${padding},${chartHeight} ${points} ${chartWidth - padding},${chartHeight}`;

    return (
        <div className="w-[420px] border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Target size={16} className="text-primary" />
                    <h2 className="font-bold text-sm">SLO Details</h2>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close details"
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                    <XCircle size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-5">
                {/* Title & Status */}
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
                            {config.icon}
                            {config.label}
                        </span>
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", categoryConfig.color)}>
                            {categoryConfig.icon}
                            {categoryConfig.label}
                        </span>
                        {slo.alertLinked && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-primary bg-primary/10">
                                <Bell size={10} />
                                Alert Linked
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold">{slo.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{slo.description}</p>
                </div>

                {/* Compliance Gauge */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Current</p>
                        <p className={cn("text-xl font-bold", config.color.split(' ')[0])}>
                            {slo.current}%
                        </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <p className="text-xl font-bold">{slo.target}%</p>
                    </div>
                </div>

                {/* Error Budget */}
                <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Error Budget</h4>
                        {slo.errorBudget.burnRate > 1 && (
                            <span className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                slo.errorBudget.burnRate > 3 ? "text-red-500 bg-red-500/10" : "text-amber-500 bg-amber-500/10"
                            )}>
                                <Flame size={10} />
                                Burning at {slo.errorBudget.burnRate}x
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-sm font-medium">{slo.errorBudget.total.toFixed(1)} min</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Remaining</p>
                            <p className={cn("text-sm font-medium",
                                slo.errorBudget.remaining < 0 ? "text-red-500" :
                                budgetPercent < 20 ? "text-amber-500" : "text-emerald-500"
                            )}>
                                {slo.errorBudget.remaining.toFixed(1)} min
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Used</p>
                            <p className="text-sm font-medium">{(100 - budgetPercent).toFixed(0)}%</p>
                        </div>
                    </div>

                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                budgetPercent > 50 ? "bg-emerald-500" :
                                budgetPercent > 20 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(100, budgetPercent)}%` }}
                        />
                    </div>
                </div>

                {/* Compliance History Chart */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Compliance History ({slo.window})</h4>
                    <div className="bg-muted/30 rounded-lg p-3">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="w-full"
                            preserveAspectRatio="none"
                        >
                            {/* Fill under curve */}
                            <polygon
                                points={fillPoints}
                                className={cn(
                                    slo.status === 'healthy' ? "fill-emerald-500/10" :
                                    slo.status === 'at_risk' ? "fill-amber-500/10" : "fill-red-500/10"
                                )}
                            />
                            {/* Target line */}
                            <line
                                x1={padding}
                                y1={targetY}
                                x2={chartWidth - padding}
                                y2={targetY}
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                className="text-muted-foreground/40"
                            />
                            <text
                                x={chartWidth - padding}
                                y={targetY - 4}
                                textAnchor="end"
                                fontSize="8"
                                className="fill-muted-foreground/60"
                            >
                                {slo.target}%
                            </text>
                            {/* Line */}
                            <polyline
                                points={points}
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                    slo.status === 'healthy' ? "stroke-emerald-500" :
                                    slo.status === 'at_risk' ? "stroke-amber-500" : "stroke-red-500"
                                )}
                            />
                        </svg>
                    </div>
                </div>

                {/* SLI Indicator */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Service Level Indicator</h4>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <code className="text-xs font-mono text-muted-foreground break-all">
                            {slo.indicator}
                        </code>
                    </div>
                </div>

                {/* Metadata */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Configuration</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Rolling Window</span>
                            <span className="font-medium">{slo.window}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-medium">{new Date(slo.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Alert Rule</span>
                            <span className={cn(
                                "font-medium",
                                slo.alertLinked ? "text-primary" : "text-muted-foreground"
                            )}>
                                {slo.alertLinked ? 'Linked' : 'Not configured'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
                    <Settings size={16} />
                    Edit SLO
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    <Bell size={16} />
                    {slo.alertLinked ? 'View Alert' : 'Link Alert'}
                </button>
            </div>
        </div>
    );
}
