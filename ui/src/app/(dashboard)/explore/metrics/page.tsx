"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Play,
    Clock,
    ChevronDown,
    Plus,
    X,
    Settings,
    History,
    Star,
    StarOff,
    Trash2,
    Copy,
    Check,
    TrendingUp,
    BarChart3,
    Table as TableIcon,
    RefreshCw,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDataQuery } from '@/lib/hooks/useDataQuery';

interface Query {
    id: string;
    expr: string;
    legendFormat?: string;
}

interface SavedQuery {
    id: string;
    name: string;
    expr: string;
    savedAt: string;
    starred: boolean;
}

// Mock saved queries
const MOCK_SAVED_QUERIES: SavedQuery[] = [
    { id: '1', name: 'CPU Usage by Instance', expr: '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', savedAt: '2026-01-05', starred: true },
    { id: '2', name: 'Memory Usage', expr: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100', savedAt: '2026-01-04', starred: true },
    { id: '3', name: 'HTTP Request Rate', expr: 'sum(rate(http_requests_total[5m])) by (status_code)', savedAt: '2026-01-03', starred: false },
    { id: '4', name: 'P95 Latency', expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))', savedAt: '2026-01-02', starred: false },
];

// Mock query history
const MOCK_HISTORY: string[] = [
    'rate(node_network_receive_bytes_total[5m])',
    'sum(up) by (job)',
    'avg(node_load1) by (instance)',
    'count(kube_pod_info) by (namespace)',
];

// Generate mock time series data
function generateMockData(queries: Query[]) {
    const now = Date.now();
    const points = 60;
    const data = [];

    for (let i = 0; i < points; i++) {
        const time = new Date(now - (points - i) * 60000);
        const point: Record<string, any> = {
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };

        queries.forEach((q, idx) => {
            const base = 50 + idx * 20;
            const noise = Math.sin(i / 10) * 10 + Math.random() * 5;
            point[`query_${idx}`] = Math.max(0, base + noise);
        });

        data.push(point);
    }

    return data;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function MetricsExplorerPage() {
    const [queries, setQueries] = useState<Query[]>([
        { id: '1', expr: 'rate(http_requests_total[5m])', legendFormat: 'Requests' }
    ]);
    const [timeRange, setTimeRange] = useState('1h');
    const [refreshInterval, setRefreshInterval] = useState('off');
    const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
    const [showHistory, setShowHistory] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const { data: queryResults, isLoading: isQueryLoading, refresh: executeQueries } = useDataQuery({
        targets: queries.map((q, i) => ({
            refId: String.fromCharCode(65 + i),
            expr: q.expr,
            legendFormat: q.legendFormat
        })),
        timeRange: { from: `now-${timeRange}`, to: 'now' },
        refreshInterval: refreshInterval === 'off' ? 0 :
            refreshInterval === '10s' ? 10000 :
                refreshInterval === '30s' ? 30000 : 60000,
        enabled: true
    });

    // Transform Series[] to recharts expected format
    const chartData = useMemo(() => {
        if (!queryResults || queryResults.length === 0) {
            // Fallback to mock data if no results
            const mock = generateMockData(queries);
            return mock;
        }

        // Collect all unique timestamps
        const timestamps = new Set<number>();
        queryResults.forEach(s => s.data.forEach(p => timestamps.add(p.timestamp)));
        const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

        return sortedTimestamps.map(ts => {
            const point: Record<string, any> = {
                time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                timestamp: ts
            };

            queryResults.forEach((s, idx) => {
                const found = s.data.find(p => p.timestamp === ts);
                point[`query_${idx}`] = found ? found.value : null;
            });

            return point;
        });
    }, [queryResults, queries]);

    const addQuery = () => {
        const newId = String(queries.length + 1);
        setQueries([...queries, { id: newId, expr: '' }]);
    };

    const removeQuery = (id: string) => {
        if (queries.length > 1) {
            setQueries(queries.filter(q => q.id !== id));
        }
    };

    const updateQuery = (id: string, updates: Partial<Query>) => {
        setQueries(queries.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const loadQuery = (expr: string) => {
        if (queries.length === 1 && !queries[0].expr) {
            updateQuery(queries[0].id, { expr });
        } else {
            addQuery();
            setTimeout(() => {
                setQueries(prev => {
                    const last = prev[prev.length - 1];
                    return prev.map(q => q.id === last.id ? { ...q, expr } : q);
                });
            }, 0);
        }
        setShowHistory(false);
        setShowSaved(false);
    };

    const router = useRouter();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/explore')}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ArrowLeft size={18} className="text-muted-foreground" />
                        </button>
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Metrics Explorer</h1>
                            <p className="text-sm text-muted-foreground">
                                Query and visualize Prometheus metrics
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                showHistory ? "bg-primary/10 text-primary" : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            <History size={14} />
                            History
                        </button>
                        <button
                            onClick={() => setShowSaved(!showSaved)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                showSaved ? "bg-primary/10 text-primary" : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            <Star size={14} />
                            Saved
                        </button>
                    </div>
                </div>

                {/* Query Inputs */}
                <div className="space-y-3">
                    {queries.map((query, idx) => (
                        <div key={query.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}
                            >
                                {String.fromCharCode(65 + idx)}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={query.expr}
                                    onChange={(e) => updateQuery(query.id, { expr: e.target.value })}
                                    placeholder="Enter PromQL expression..."
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none pr-24"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {queries.length > 1 && (
                                        <button
                                            onClick={() => removeQuery(query.id)}
                                            className="p-1 hover:bg-muted rounded"
                                        >
                                            <X size={14} className="text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="text"
                                value={query.legendFormat || ''}
                                onChange={(e) => updateQuery(query.id, { legendFormat: e.target.value })}
                                placeholder="Legend"
                                className="w-32 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                            />
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={addQuery}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            <Plus size={14} />
                            Add query
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            data-testid="metrics-time-range"
                            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        >
                            <option value="15m">Last 15 minutes</option>
                            <option value="1h">Last 1 hour</option>
                            <option value="6h">Last 6 hours</option>
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                        </select>

                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(e.target.value)}
                            data-testid="metrics-refresh-interval"
                            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        >
                            <option value="off">Auto-refresh: Off</option>
                            <option value="10s">Every 10s</option>
                            <option value="30s">Every 30s</option>
                            <option value="1m">Every 1m</option>
                        </select>

                        <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                            <button
                                onClick={() => setViewMode('graph')}
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    viewMode === 'graph' ? "bg-background shadow-sm" : "hover:bg-muted/80"
                                )}
                            >
                                <BarChart3 size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    viewMode === 'table' ? "bg-background shadow-sm" : "hover:bg-muted/80"
                                )}
                            >
                                <TableIcon size={14} />
                            </button>
                        </div>

                        <button
                            onClick={executeQueries}
                            disabled={isExecuting || queries.every(q => !q.expr)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                queries.some(q => q.expr)
                                    ? "bg-primary text-primary-foreground hover:opacity-90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isExecuting ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Play size={14} />
                            )}
                            Execute
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Chart/Table Area */}
                <div className="flex-1 p-6 overflow-auto">
                    {viewMode === 'graph' ? (
                        <div className="bg-card border border-border rounded-xl p-4 h-full min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        {queries.map((q, idx) => (
                                            <linearGradient key={q.id} id={`gradient-${q.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#141417',
                                            border: '1px solid #27272a',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Legend />
                                    {queries.map((q, idx) => (
                                        <Area
                                            key={q.id}
                                            type="monotone"
                                            dataKey={`query_${idx}`}
                                            name={q.legendFormat || `Query ${String.fromCharCode(65 + idx)}`}
                                            stroke={COLORS[idx % COLORS.length]}
                                            strokeWidth={2}
                                            fill={`url(#gradient-${q.id})`}
                                            fillOpacity={1}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-4 py-3 text-sm font-medium">Time</th>
                                        {queries.map((q, idx) => (
                                            <th key={q.id} className="text-left px-4 py-3 text-sm font-medium">
                                                {q.legendFormat || `Query ${String.fromCharCode(65 + idx)}`}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="border-b border-border hover:bg-muted/30">
                                            <td className="px-4 py-2 text-sm font-mono">{row.time}</td>
                                            {queries.map((q, idx) => (
                                                <td key={q.id} className="px-4 py-2 text-sm font-mono">
                                                    {row[`query_${idx}`]?.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sidebar - History/Saved */}
                {(showHistory || showSaved) && (
                    <div className="w-80 border-l border-border bg-card/50 overflow-auto">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-medium">
                                {showHistory ? 'Query History' : 'Saved Queries'}
                            </h3>
                            <button
                                onClick={() => { setShowHistory(false); setShowSaved(false); }}
                                className="p-1 hover:bg-muted rounded"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-4 space-y-2">
                            {showHistory && MOCK_HISTORY.map((expr, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => loadQuery(expr)}
                                    className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <code className="text-xs font-mono text-muted-foreground line-clamp-2">
                                        {expr}
                                    </code>
                                </button>
                            ))}

                            {showSaved && MOCK_SAVED_QUERIES.map(saved => (
                                <button
                                    key={saved.id}
                                    onClick={() => loadQuery(saved.expr)}
                                    className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {saved.starred && <Star size={12} className="text-amber-500 fill-amber-500" />}
                                        <span className="text-sm font-medium">{saved.name}</span>
                                    </div>
                                    <code className="text-xs font-mono text-muted-foreground line-clamp-2">
                                        {saved.expr}
                                    </code>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
