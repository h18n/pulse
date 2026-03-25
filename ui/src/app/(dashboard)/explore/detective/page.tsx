"use client";

import React, { useState, useMemo } from 'react';
import {
    Brain,
    Search,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    Layers,
    GitCommit,
    ArrowRight,
    ChevronRight,
    ChevronDown,
    Filter,
    RefreshCw,
    Download,
    Eye,
    Zap,
    Target,
    Hash,
    BarChart3,
    XCircle,
    Copy,
    Check,
    MessageSquare,
    Flame,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============== Types ==============

type AnomalyLevel = 'critical' | 'warning' | 'normal';
type ClusterStatus = 'new' | 'growing' | 'stable' | 'declining';

interface LogPattern {
    id: string;
    pattern: string;
    sampleLog: string;
    count: number;
    percentage: number;
    anomalyScore: number; // 0-1, higher = more anomalous
    isolationDepth: number; // lower depth = easier to isolate = more anomalous
    level: AnomalyLevel;
    status: ClusterStatus;
    service: string;
    firstSeen: string;
    lastSeen: string;
    trend: number[]; // last 12 data points
    beforeDeployCount?: number;
    afterDeployCount?: number;
}

interface Deployment {
    id: string;
    service: string;
    version: string;
    timestamp: string;
    commit: string;
    author: string;
    newPatterns: number;
    gonePatterns: number;
}

// ============== Mock Data ==============

const MOCK_DEPLOYMENTS: Deployment[] = [
    {
        id: 'dep-1',
        service: 'api-gateway',
        version: 'v2.14.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        commit: 'a3f8d2e',
        author: 'sarah.chen',
        newPatterns: 3,
        gonePatterns: 1,
    },
    {
        id: 'dep-2',
        service: 'payment-service',
        version: 'v1.8.3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        commit: 'b7c91f4',
        author: 'alex.kumar',
        newPatterns: 0,
        gonePatterns: 0,
    },
];

const MOCK_PATTERNS: LogPattern[] = [
    {
        id: 'c1',
        pattern: 'ERROR database connection pool exhausted after {N}ms timeout',
        sampleLog: '2026-03-25T15:32:01Z ERROR [pool-manager] database connection pool exhausted after 5000ms timeout - active: 50/50, waiting: 23',
        count: 847,
        percentage: 12.3,
        anomalyScore: 0.94,
        isolationDepth: 2.1,
        level: 'critical',
        status: 'growing',
        service: 'api-gateway',
        firstSeen: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
        trend: [0, 0, 2, 5, 12, 34, 67, 128, 156, 189, 134, 120],
        beforeDeployCount: 0,
        afterDeployCount: 847,
    },
    {
        id: 'c2',
        pattern: 'WARN request latency exceeded SLO threshold: {N}ms > {N}ms',
        sampleLog: '2026-03-25T15:33:12Z WARN [http-handler] request latency exceeded SLO threshold: 2341ms > 500ms for POST /api/v2/checkout',
        count: 1234,
        percentage: 17.9,
        anomalyScore: 0.87,
        isolationDepth: 2.8,
        level: 'critical',
        status: 'growing',
        service: 'api-gateway',
        firstSeen: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 0.5).toISOString(),
        trend: [12, 15, 18, 22, 45, 89, 167, 234, 198, 156, 145, 133],
        beforeDeployCount: 15,
        afterDeployCount: 1219,
    },
    {
        id: 'c3',
        pattern: 'ERROR payment gateway timeout: context deadline exceeded',
        sampleLog: '2026-03-25T15:31:45Z ERROR [payment-client] payment gateway timeout: context deadline exceeded after 30s for txn_8f7a2b3c',
        count: 234,
        percentage: 3.4,
        anomalyScore: 0.82,
        isolationDepth: 3.1,
        level: 'warning',
        status: 'stable',
        service: 'payment-service',
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        trend: [23, 19, 25, 21, 28, 22, 19, 20, 18, 17, 22, 20],
    },
    {
        id: 'c4',
        pattern: 'WARN retry attempt {N}/{N} for downstream service {service}',
        sampleLog: '2026-03-25T15:30:22Z WARN [circuit-breaker] retry attempt 3/5 for downstream service inventory-api - backoff: 4000ms',
        count: 567,
        percentage: 8.2,
        anomalyScore: 0.71,
        isolationDepth: 3.6,
        level: 'warning',
        status: 'declining',
        service: 'api-gateway',
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        trend: [89, 78, 67, 72, 56, 45, 52, 41, 38, 34, 29, 26],
    },
    {
        id: 'c5',
        pattern: 'INFO request completed successfully in {N}ms',
        sampleLog: '2026-03-25T15:34:01Z INFO [http-handler] request completed successfully in 45ms for GET /api/v2/health',
        count: 3456,
        percentage: 50.1,
        anomalyScore: 0.05,
        isolationDepth: 8.9,
        level: 'normal',
        status: 'stable',
        service: 'api-gateway',
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 5).toISOString(),
        trend: [289, 301, 295, 310, 288, 278, 305, 312, 290, 298, 307, 283],
    },
    {
        id: 'c6',
        pattern: 'DEBUG cache {action} for key {key} ttl={N}s',
        sampleLog: '2026-03-25T15:34:10Z DEBUG [cache-mgr] cache HIT for key user:profile:8291 ttl=3600s',
        count: 2891,
        percentage: 41.9,
        anomalyScore: 0.02,
        isolationDepth: 9.4,
        level: 'normal',
        status: 'stable',
        service: 'api-gateway',
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 2).toISOString(),
        trend: [241, 252, 238, 249, 244, 256, 240, 258, 245, 251, 247, 260],
    },
    {
        id: 'c7',
        pattern: 'WARN certificate for {domain} expires in {N} days',
        sampleLog: '2026-03-25T12:00:00Z WARN [tls-monitor] certificate for api.example.com expires in 12 days - auto-renewal: enabled',
        count: 48,
        percentage: 0.7,
        anomalyScore: 0.15,
        isolationDepth: 7.2,
        level: 'normal',
        status: 'stable',
        service: 'tls-monitor',
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        trend: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    },
    {
        id: 'c8',
        pattern: 'ERROR OOMKilled: container exceeded memory limit {N}Mi',
        sampleLog: '2026-03-25T15:28:55Z ERROR [k8s-events] OOMKilled: container exceeded memory limit 512Mi in pod worker-batch-7f8a9 - restarts: 3',
        count: 12,
        percentage: 0.2,
        anomalyScore: 0.91,
        isolationDepth: 2.3,
        level: 'critical',
        status: 'new',
        service: 'worker-batch',
        firstSeen: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        trend: [0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 4, 4],
        beforeDeployCount: 0,
        afterDeployCount: 12,
    },
];

const PIPELINE_STATS = {
    totalLogs: 6893,
    clustersFound: 8,
    anomaliesDetected: 3,
    normalPatterns: 5,
    avgIsolationDepth: 5.4,
    contamination: 0.038,
    processingTime: 1.2,
};

// ============== Main Component ==============

export default function DetectivePage() {
    const [activeView, setActiveView] = useState<'clusters' | 'timeline' | 'isolation'>('clusters');
    const [sortBy, setSortBy] = useState<'anomaly' | 'count' | 'recent'>('anomaly');
    const [filterLevel, setFilterLevel] = useState<AnomalyLevel | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPattern, setSelectedPattern] = useState<LogPattern | null>(null);

    const sortedPatterns = useMemo(() => {
        let filtered = MOCK_PATTERNS.filter(p => {
            const matchesSearch = p.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.service.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = filterLevel === 'all' || p.level === filterLevel;
            return matchesSearch && matchesLevel;
        });

        switch (sortBy) {
            case 'anomaly':
                return filtered.sort((a, b) => b.anomalyScore - a.anomalyScore);
            case 'count':
                return filtered.sort((a, b) => b.count - a.count);
            case 'recent':
                return filtered.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
            default:
                return filtered;
        }
    }, [searchQuery, filterLevel, sortBy]);

    const anomalies = sortedPatterns.filter(p => p.level !== 'normal');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Detective</h1>
                            <p className="text-sm text-muted-foreground">
                                ML-powered log clustering &amp; anomaly detection
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg text-sm">
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-red-500 font-bold">{anomalies.length}</span>
                            <span className="text-muted-foreground">anomalies</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
                            <Layers size={14} className="text-muted-foreground" />
                            <span className="font-medium">{PIPELINE_STATS.clustersFound}</span>
                            <span className="text-muted-foreground">clusters</span>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            <RefreshCw size={16} />
                            Re-analyze
                        </button>
                    </div>
                </div>

                {/* View Tabs */}
                <div className="flex items-center gap-1">
                    {[
                        { id: 'clusters', label: 'Pattern Clusters', icon: Layers },
                        { id: 'timeline', label: 'Deployment Timeline', icon: GitCommit },
                        { id: 'isolation', label: 'Isolation Forest', icon: Target },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeView === tab.id
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
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto p-6">
                    {activeView === 'clusters' && (
                        <ClustersView
                            patterns={sortedPatterns}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            filterLevel={filterLevel}
                            onFilterChange={setFilterLevel}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSelect={setSelectedPattern}
                            selectedId={selectedPattern?.id}
                        />
                    )}
                    {activeView === 'timeline' && (
                        <TimelineView deployments={MOCK_DEPLOYMENTS} patterns={MOCK_PATTERNS} />
                    )}
                    {activeView === 'isolation' && (
                        <IsolationView patterns={MOCK_PATTERNS} stats={PIPELINE_STATS} />
                    )}
                </div>

                {/* Detail Sidebar */}
                {selectedPattern && (
                    <PatternDetailSidebar
                        pattern={selectedPattern}
                        onClose={() => setSelectedPattern(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ============== Clusters View ==============

function ClustersView({
    patterns, sortBy, onSortChange, filterLevel, onFilterChange,
    searchQuery, onSearchChange, onSelect, selectedId,
}: {
    patterns: LogPattern[];
    sortBy: string;
    onSortChange: (s: 'anomaly' | 'count' | 'recent') => void;
    filterLevel: AnomalyLevel | 'all';
    onFilterChange: (l: AnomalyLevel | 'all') => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onSelect: (p: LogPattern) => void;
    selectedId?: string;
}) {
    return (
        <div className="max-w-5xl space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search patterns or services..."
                        className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {(['all', 'critical', 'warning', 'normal'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => onFilterChange(level)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                filterLevel === level
                                    ? level === 'critical' ? "text-red-500 bg-red-500/10"
                                    : level === 'warning' ? "text-amber-500 bg-amber-500/10"
                                    : level === 'normal' ? "text-emerald-500 bg-emerald-500/10"
                                    : "text-primary bg-primary/10"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as any)}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 ring-primary focus:outline-none"
                >
                    <option value="anomaly">Sort: Anomaly Score</option>
                    <option value="count">Sort: Log Count</option>
                    <option value="recent">Sort: Most Recent</option>
                </select>
            </div>

            {/* Pattern list */}
            <div className="space-y-3">
                {patterns.map(pattern => (
                    <PatternCard
                        key={pattern.id}
                        pattern={pattern}
                        isSelected={selectedId === pattern.id}
                        onClick={() => onSelect(pattern)}
                    />
                ))}
            </div>
        </div>
    );
}

function PatternCard({ pattern, isSelected, onClick }: {
    pattern: LogPattern; isSelected: boolean; onClick: () => void;
}) {
    const levelConfig = {
        critical: { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical', ring: 'ring-red-500/20' },
        warning: { color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Warning', ring: 'ring-amber-500/20' },
        normal: { color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Normal', ring: 'ring-emerald-500/20' },
    };

    const statusConfig = {
        new: { icon: <Sparkles size={10} />, label: 'New', color: 'text-cyan-500 bg-cyan-500/10' },
        growing: { icon: <TrendingUp size={10} />, label: 'Growing', color: 'text-red-500 bg-red-500/10' },
        stable: { icon: <Activity size={10} />, label: 'Stable', color: 'text-muted-foreground bg-muted' },
        declining: { icon: <TrendingDown size={10} />, label: 'Declining', color: 'text-emerald-500 bg-emerald-500/10' },
    };

    const config = levelConfig[pattern.level];
    const status = statusConfig[pattern.status];

    // Mini sparkline
    const maxTrend = Math.max(...pattern.trend);
    const sparkPoints = pattern.trend.map((v, i) => {
        const x = (i / (pattern.trend.length - 1)) * 80;
        const y = 20 - (v / (maxTrend || 1)) * 16;
        return `${x},${y}`;
    }).join(' ');

    // Anomaly bar width
    const anomalyPercent = Math.round(pattern.anomalyScore * 100);

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-card border rounded-xl transition-all cursor-pointer group hover:shadow-lg hover:shadow-black/5",
                isSelected ? cn("ring-2", config.ring, "border-transparent") : "border-border"
            )}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Anomaly level bar */}
                    <div className={cn("w-1 h-16 rounded-full shrink-0", config.color)} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                                {status.icon}
                                {status.label}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {pattern.service}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {pattern.count.toLocaleString()} occurrences ({pattern.percentage}%)
                            </span>
                        </div>

                        {/* Pattern template */}
                        <code className="text-sm font-mono block truncate mb-2">
                            {pattern.pattern}
                        </code>

                        {/* Bottom row */}
                        <div className="flex items-center gap-4">
                            {/* Anomaly score bar */}
                            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                <span className="text-xs text-muted-foreground w-16">Score</span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            anomalyPercent > 80 ? "bg-red-500" :
                                            anomalyPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${anomalyPercent}%` }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold w-8 text-right",
                                    config.text
                                )}>
                                    {anomalyPercent}
                                </span>
                            </div>

                            {/* Isolation depth */}
                            <span className="text-xs text-muted-foreground">
                                Depth: <span className="font-medium text-foreground">{pattern.isolationDepth.toFixed(1)}</span>
                            </span>
                        </div>
                    </div>

                    {/* Sparkline */}
                    <div className="shrink-0">
                        <svg width="80" height="24" className="text-muted-foreground/30">
                            <polyline
                                points={sparkPoints}
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                className={cn(
                                    pattern.status === 'growing' ? "stroke-red-500" :
                                    pattern.status === 'declining' ? "stroke-emerald-500" : "stroke-muted-foreground/40"
                                )}
                            />
                        </svg>
                    </div>

                    <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-4" />
                </div>
            </div>
        </div>
    );
}

// ============== Timeline View ==============

function TimelineView({ deployments, patterns }: {
    deployments: Deployment[];
    patterns: LogPattern[];
}) {
    return (
        <div className="max-w-4xl space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-1">Deployment Impact Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Pattern changes detected before and after each deployment
                </p>

                <div className="space-y-6">
                    {deployments.map(dep => {
                        const affectedPatterns = patterns.filter(p =>
                            p.beforeDeployCount !== undefined && p.service === dep.service
                        );
                        return (
                            <div key={dep.id} className="relative">
                                {/* Deployment marker */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <GitCommit size={18} className="text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm">{dep.service}</h4>
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">
                                                {dep.version}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {dep.commit}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            by {dep.author} · {getRelativeTime(new Date(dep.timestamp))}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {dep.newPatterns > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">
                                                <TrendingUp size={12} />
                                                {dep.newPatterns} new patterns
                                            </span>
                                        )}
                                        {dep.gonePatterns > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                <TrendingDown size={12} />
                                                {dep.gonePatterns} resolved
                                            </span>
                                        )}
                                        {dep.newPatterns === 0 && dep.gonePatterns === 0 && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                                <CheckCircle2 size={12} />
                                                No impact
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Before/After comparison */}
                                {affectedPatterns.length > 0 && (
                                    <div className="ml-[52px] space-y-2">
                                        {affectedPatterns.map(p => {
                                            const beforeCount = p.beforeDeployCount || 0;
                                            const afterCount = p.afterDeployCount || 0;
                                            const change = afterCount - beforeCount;
                                            const maxCount = Math.max(beforeCount, afterCount, 1);

                                            return (
                                                <div key={p.id} className="p-3 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            p.level === 'critical' ? "bg-red-500" :
                                                            p.level === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                                                        )} />
                                                        <code className="text-xs font-mono truncate flex-1">{p.pattern}</code>
                                                        <span className={cn(
                                                            "text-xs font-medium",
                                                            change > 0 ? "text-red-500" : change < 0 ? "text-emerald-500" : "text-muted-foreground"
                                                        )}>
                                                            {change > 0 ? '+' : ''}{change.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {/* Before/After bars */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                                <span>Before</span>
                                                                <span>{beforeCount.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-muted-foreground/30 rounded-full"
                                                                    style={{ width: `${(beforeCount / maxCount) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                                <span>After</span>
                                                                <span>{afterCount.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        change > beforeCount ? "bg-red-500" :
                                                                        change > 0 ? "bg-amber-500" : "bg-emerald-500"
                                                                    )}
                                                                    style={{ width: `${(afterCount / maxCount) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============== Isolation Forest View ==============

function IsolationView({ patterns, stats }: { patterns: LogPattern[]; stats: typeof PIPELINE_STATS }) {
    const sorted = [...patterns].sort((a, b) => a.isolationDepth - b.isolationDepth);
    const maxDepth = Math.max(...sorted.map(p => p.isolationDepth));

    return (
        <div className="max-w-5xl space-y-6">
            {/* Pipeline stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Logs Analyzed</p>
                    <p className="text-xl font-bold">{stats.totalLogs.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Contamination Rate</p>
                    <p className="text-xl font-bold text-red-500">{(stats.contamination * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Avg Isolation Depth</p>
                    <p className="text-xl font-bold">{stats.avgIsolationDepth.toFixed(1)}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                    <p className="text-xl font-bold">{stats.processingTime}s</p>
                </div>
            </div>

            {/* Explanation */}
            <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <Target size={16} className="text-cyan-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">How Isolation Forest Works</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Isolation Forest isolates anomalies by randomly partitioning data. Anomalous log patterns
                            are <span className="text-red-500 font-medium">easier to isolate</span> (fewer splits needed),
                            resulting in a <span className="text-red-500 font-medium">lower depth score</span>.
                            Normal patterns require more splits and have a <span className="text-emerald-500 font-medium">higher depth</span>.
                        </p>
                    </div>
                </div>

                {/* Depth chart */}
                <div className="space-y-2 mt-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-2 mb-2">
                        <span className="text-red-500 font-medium">← Anomalous (easy to isolate)</span>
                        <span className="text-emerald-500 font-medium">Normal (hard to isolate) →</span>
                    </div>

                    {sorted.map(pattern => {
                        const depthPercent = (pattern.isolationDepth / maxDepth) * 100;
                        const levelColors = {
                            critical: 'bg-red-500',
                            warning: 'bg-amber-500',
                            normal: 'bg-emerald-500',
                        };

                        return (
                            <div key={pattern.id} className="flex items-center gap-3 group">
                                <div className="w-[200px] shrink-0 text-right">
                                    <code className="text-xs font-mono text-muted-foreground truncate block">
                                        {pattern.pattern.length > 35
                                            ? pattern.pattern.slice(0, 35) + '...'
                                            : pattern.pattern}
                                    </code>
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden relative">
                                        <div
                                            className={cn(
                                                "h-full rounded-lg transition-all flex items-center justify-end px-2",
                                                levelColors[pattern.level]
                                            )}
                                            style={{
                                                width: `${depthPercent}%`,
                                                opacity: pattern.level === 'normal' ? 0.5 : 0.8,
                                            }}
                                        >
                                            <span className="text-[10px] font-bold text-white">
                                                {pattern.isolationDepth.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground w-14 text-right">
                                        {pattern.count.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-sm mb-3">Score Interpretation</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded bg-red-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Depth &lt; 3.0</p>
                            <p className="text-xs text-muted-foreground">Highly anomalous. Investigate immediately.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Depth 3.0-5.0</p>
                            <p className="text-xs text-muted-foreground">Moderately anomalous. Worth reviewing.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Depth &gt; 5.0</p>
                            <p className="text-xs text-muted-foreground">Normal pattern. Expected behavior.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============== Pattern Detail Sidebar ==============

function PatternDetailSidebar({ pattern, onClose }: { pattern: LogPattern; onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(pattern.sampleLog);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const levelConfig = {
        critical: { color: 'text-red-500 bg-red-500/10', label: 'Critical Anomaly', icon: <Flame size={14} /> },
        warning: { color: 'text-amber-500 bg-amber-500/10', label: 'Warning', icon: <AlertTriangle size={14} /> },
        normal: { color: 'text-emerald-500 bg-emerald-500/10', label: 'Normal Pattern', icon: <CheckCircle2 size={14} /> },
    };

    const config = levelConfig[pattern.level];
    const anomalyPercent = Math.round(pattern.anomalyScore * 100);

    // Trend chart
    const maxTrend = Math.max(...pattern.trend);
    const chartWidth = 350;
    const chartHeight = 80;
    const points = pattern.trend.map((v, i) => {
        const x = (i / (pattern.trend.length - 1)) * chartWidth;
        const y = chartHeight - (v / (maxTrend || 1)) * (chartHeight - 8);
        return `${x},${y}`;
    }).join(' ');
    const fillPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

    return (
        <div className="w-[420px] border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Brain size={16} className="text-cyan-500" />
                    <h2 className="font-bold text-sm">Pattern Details</h2>
                </div>
                <button onClick={onClose} aria-label="Close details" className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <XCircle size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-5">
                {/* Status & Level */}
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
                            {config.icon}
                            {config.label}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{pattern.service}</span>
                    </div>
                    <h3 className="text-sm font-bold font-mono break-all">{pattern.pattern}</h3>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Anomaly</p>
                        <p className={cn("text-lg font-bold",
                            anomalyPercent > 80 ? "text-red-500" :
                            anomalyPercent > 50 ? "text-amber-500" : "text-emerald-500"
                        )}>{anomalyPercent}%</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Depth</p>
                        <p className="text-lg font-bold">{pattern.isolationDepth.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Count</p>
                        <p className="text-lg font-bold">{pattern.count.toLocaleString()}</p>
                    </div>
                </div>

                {/* Trend chart */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Frequency Trend</h4>
                    <div className="bg-muted/30 rounded-lg p-3">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="none">
                            <polygon
                                points={fillPoints}
                                className={cn(
                                    pattern.level === 'critical' ? "fill-red-500/10" :
                                    pattern.level === 'warning' ? "fill-amber-500/10" : "fill-emerald-500/10"
                                )}
                            />
                            <polyline
                                points={points}
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                    pattern.level === 'critical' ? "stroke-red-500" :
                                    pattern.level === 'warning' ? "stroke-amber-500" : "stroke-emerald-500"
                                )}
                            />
                        </svg>
                    </div>
                </div>

                {/* Sample Log */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Sample Log</h4>
                        <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <code className="text-xs font-mono text-muted-foreground break-all whitespace-pre-wrap">
                            {pattern.sampleLog}
                        </code>
                    </div>
                </div>

                {/* Before/After Deploy */}
                {pattern.beforeDeployCount !== undefined && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Deployment Impact</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Before Deploy</p>
                                <p className="text-lg font-bold">{pattern.beforeDeployCount.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <p className="text-xs text-red-500">After Deploy</p>
                                <p className="text-lg font-bold text-red-500">
                                    {(pattern.afterDeployCount || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Timeline</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">First seen</span>
                            <span className="font-medium">{getRelativeTime(new Date(pattern.firstSeen))}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Last seen</span>
                            <span className="font-medium">{getRelativeTime(new Date(pattern.lastSeen))}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
                    <Download size={16} />
                    Export
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    <MessageSquare size={16} />
                    Ask Copilot
                </button>
            </div>
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
