'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Globe,
    Database,
    Search,
    Play,
    RefreshCw,
    AlertCircle,
    Check,
    Clock,
    Layers,
    MapPin,
    ChevronDown,
    X,
    TrendingUp,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThanosService, ThanosStore, ThanosQueryResult } from '@/lib/thanos';

interface GlobalQueryExplorerProps {
    className?: string;
}

interface RegionStatus {
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'offline';
    stores: number;
    lastChecked: string;
}

export function GlobalQueryExplorer({ className }: GlobalQueryExplorerProps) {
    const [query, setQuery] = useState('up');
    const [isQuerying, setIsQuerying] = useState(false);
    const [queryResult, setQueryResult] = useState<ThanosQueryResult | null>(null);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [stores, setStores] = useState<ThanosStore[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [showRegionSelector, setShowRegionSelector] = useState(false);
    const [queryTime, setQueryTime] = useState<number | null>(null);

    const thanosService = getThanosService();
    const regions = thanosService.getRegions();

    // Mock region statuses for demo
    const [regionStatuses] = useState<RegionStatus[]>([
        { id: 'us-east-1', name: 'US East', status: 'healthy', stores: 3, lastChecked: new Date().toISOString() },
        { id: 'us-west-2', name: 'US West', status: 'healthy', stores: 2, lastChecked: new Date().toISOString() },
        { id: 'eu-west-1', name: 'EU West', status: 'degraded', stores: 2, lastChecked: new Date().toISOString() },
        { id: 'ap-south-1', name: 'Asia Pacific', status: 'healthy', stores: 2, lastChecked: new Date().toISOString() },
    ]);

    // Load stores on mount
    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            // Mock stores for demo
            setStores([
                { name: 'prometheus-us-east-1', labels: [{ region: 'us-east-1' }], minTime: Date.now() - 86400000 * 30, maxTime: Date.now(), storeType: 'sidecar', lastCheck: new Date().toISOString() },
                { name: 'prometheus-us-east-2', labels: [{ region: 'us-east-1' }], minTime: Date.now() - 86400000 * 30, maxTime: Date.now(), storeType: 'sidecar', lastCheck: new Date().toISOString() },
                { name: 'prometheus-us-west', labels: [{ region: 'us-west-2' }], minTime: Date.now() - 86400000 * 30, maxTime: Date.now(), storeType: 'sidecar', lastCheck: new Date().toISOString() },
                { name: 'thanos-store-s3', labels: [{ region: 'global' }], minTime: Date.now() - 86400000 * 365, maxTime: Date.now(), storeType: 'store', lastCheck: new Date().toISOString() },
                { name: 'prometheus-eu', labels: [{ region: 'eu-west-1' }], minTime: Date.now() - 86400000 * 30, maxTime: Date.now(), storeType: 'sidecar', lastCheck: new Date().toISOString() },
                { name: 'prometheus-ap', labels: [{ region: 'ap-south-1' }], minTime: Date.now() - 86400000 * 30, maxTime: Date.now(), storeType: 'sidecar', lastCheck: new Date().toISOString() },
            ]);
        } catch (error) {
            console.error('Failed to load stores:', error);
        }
    };

    // Execute query
    const executeQuery = useCallback(async () => {
        if (!query.trim()) return;

        setIsQuerying(true);
        setQueryError(null);
        const startTime = Date.now();

        try {
            // Mock query result for demo
            const mockResult: ThanosQueryResult = {
                status: 'success',
                data: {
                    resultType: 'vector',
                    result: [
                        { metric: { __name__: 'up', instance: 'prometheus-us-east:9090', job: 'prometheus', region: 'us-east-1' }, value: [Date.now() / 1000, '1'] },
                        { metric: { __name__: 'up', instance: 'prometheus-us-west:9090', job: 'prometheus', region: 'us-west-2' }, value: [Date.now() / 1000, '1'] },
                        { metric: { __name__: 'up', instance: 'prometheus-eu:9090', job: 'prometheus', region: 'eu-west-1' }, value: [Date.now() / 1000, '1'] },
                        { metric: { __name__: 'up', instance: 'prometheus-ap:9090', job: 'prometheus', region: 'ap-south-1' }, value: [Date.now() / 1000, '1'] },
                        { metric: { __name__: 'up', instance: 'node-exporter-1:9100', job: 'node', region: 'us-east-1' }, value: [Date.now() / 1000, '1'] },
                        { metric: { __name__: 'up', instance: 'node-exporter-2:9100', job: 'node', region: 'us-east-1' }, value: [Date.now() / 1000, '1'] },
                        { metric: { __name__: 'up', instance: 'node-exporter-3:9100', job: 'node', region: 'us-west-2' }, value: [Date.now() / 1000, '0'] },
                    ],
                },
                stats: {
                    timings: { evalTotalTime: 0.045, resultSortTime: 0.001, queryPreparationTime: 0.002 },
                    samples: { totalQueryableSamples: 15420, peakSamples: 7200 },
                },
            };

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            setQueryResult(mockResult);
            setQueryTime(Date.now() - startTime);
        } catch (error) {
            setQueryError(error instanceof Error ? error.message : 'Query failed');
        } finally {
            setIsQuerying(false);
        }
    }, [query, selectedRegions]);

    // Toggle region selection
    const toggleRegion = (regionId: string) => {
        setSelectedRegions(prev =>
            prev.includes(regionId)
                ? prev.filter(id => id !== regionId)
                : [...prev, regionId]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-emerald-500';
            case 'degraded': return 'text-amber-500';
            case 'offline': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-emerald-500';
            case 'degraded': return 'bg-amber-500';
            case 'offline': return 'bg-red-500';
            default: return 'bg-muted';
        }
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Globe size={20} className="text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Global Query Explorer</h2>
                        <p className="text-sm text-muted-foreground">
                            Query metrics across all regions via Thanos
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadStores}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Refresh stores"
                    >
                        <RefreshCw size={16} className="text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Region Status Grid */}
            <div className="grid grid-cols-4 gap-4">
                {regionStatuses.map(region => (
                    <div
                        key={region.id}
                        onClick={() => toggleRegion(region.id)}
                        className={cn(
                            "p-4 bg-card border rounded-xl cursor-pointer transition-all",
                            selectedRegions.includes(region.id)
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className={getStatusColor(region.status)} />
                                <span className="text-sm font-medium">{region.name}</span>
                            </div>
                            <span className={cn("w-2 h-2 rounded-full", getStatusBg(region.status))} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Database size={12} />
                                {region.stores} stores
                            </span>
                            <span className={cn("capitalize", getStatusColor(region.status))}>
                                {region.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Query Input */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeQuery()}
                            placeholder="Enter PromQL query (e.g., up, node_cpu_seconds_total)"
                            className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Region filter dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowRegionSelector(!showRegionSelector)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 border rounded-xl text-sm",
                                selectedRegions.length > 0
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted hover:bg-muted/80"
                            )}
                        >
                            <Layers size={16} />
                            {selectedRegions.length > 0 ? `${selectedRegions.length} regions` : 'All regions'}
                            <ChevronDown size={14} />
                        </button>

                        {showRegionSelector && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-10 py-1">
                                <button
                                    onClick={() => { setSelectedRegions([]); setShowRegionSelector(false); }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-muted",
                                        selectedRegions.length === 0 && "bg-primary/10 text-primary"
                                    )}
                                >
                                    All Regions
                                </button>
                                <div className="border-t border-border my-1" />
                                {regionStatuses.map(region => (
                                    <button
                                        key={region.id}
                                        onClick={() => toggleRegion(region.id)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between",
                                            selectedRegions.includes(region.id) && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <span>{region.name}</span>
                                        {selectedRegions.includes(region.id) && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={executeQuery}
                        disabled={isQuerying || !query.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {isQuerying ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <Play size={16} />
                        )}
                        Run Query
                    </button>
                </div>

                {/* Query stats */}
                {queryTime !== null && queryResult && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {queryTime}ms total
                        </span>
                        <span className="flex items-center gap-1">
                            <Activity size={12} />
                            {queryResult.data.result.length} results
                        </span>
                        {queryResult.stats?.samples && (
                            <span className="flex items-center gap-1">
                                <TrendingUp size={12} />
                                {queryResult.stats.samples.totalQueryableSamples.toLocaleString()} samples queried
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Error */}
            {queryError && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl">
                    <AlertCircle size={16} />
                    <span className="text-sm">{queryError}</span>
                </div>
            )}

            {/* Results */}
            {queryResult && (
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                        Results ({queryResult.data.result.length} series)
                    </h3>

                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="text-left px-4 py-3 font-medium">Metric</th>
                                    <th className="text-left px-4 py-3 font-medium">Labels</th>
                                    <th className="text-left px-4 py-3 font-medium">Region</th>
                                    <th className="text-right px-4 py-3 font-medium">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queryResult.data.result.map((result, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-t border-border hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono text-primary">
                                            {result.metric.__name__ || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(result.metric)
                                                    .filter(([k]) => k !== '__name__' && k !== 'region')
                                                    .slice(0, 3)
                                                    .map(([k, v]) => (
                                                        <span
                                                            key={k}
                                                            className="px-1.5 py-0.5 bg-muted rounded text-xs"
                                                        >
                                                            {k}="{v}"
                                                        </span>
                                                    ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-xs">
                                                <MapPin size={12} className="text-muted-foreground" />
                                                {result.metric.region || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            <span className={cn(
                                                result.value?.[1] === '1' ? 'text-emerald-500' :
                                                    result.value?.[1] === '0' ? 'text-red-500' : ''
                                            )}>
                                                {result.value?.[1] || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Store List */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Database size={14} />
                    Connected Stores ({stores.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {stores.map((store, idx) => (
                        <div
                            key={idx}
                            className="p-3 bg-muted/30 border border-border rounded-lg"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate">{store.name}</span>
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    store.lastError ? "bg-red-500" : "bg-emerald-500"
                                )} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <span className="capitalize">{store.storeType}</span>
                                {store.labels[0] && ` • ${Object.values(store.labels[0])[0]}`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default GlobalQueryExplorer;
