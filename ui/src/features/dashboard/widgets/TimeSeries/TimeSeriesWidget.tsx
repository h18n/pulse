"use client";

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { WidgetProps } from '../registry';
import { useDataQuery, useMockData } from '@/lib/hooks/useDataQuery';
import { Loader2, Activity } from 'lucide-react';
import { useAnomaly } from '@/lib/hooks/useAnomaly';
import { cn } from '@/lib/utils';

const COLORS = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
];

export function TimeSeriesWidget({ panel, timeRange, variables, lastRefresh }: WidgetProps) {
    const options = panel.options as Record<string, any> || {};
    const showLegend = options.legend?.showLegend !== false;
    const legendPlacement = options.legend?.placement || 'bottom';

    // Try to fetch real data
    const { data: realData, isLoading } = useDataQuery({
        targets: panel.targets || [],
        timeRange: timeRange || { from: 'now-6h', to: 'now' },
        variables: variables || {},
        enabled: panel.targets?.some(t => t.expr || t.query),
        maxDataPoints: 100,
    });

    // Always generate mock data as fallback
    const mockData = useMockData({
        panelType: 'timeseries',
        seriesCount: panel.targets?.length || 2,
        pointCount: 24,
        timeRange: timeRange || { from: 'now-6h', to: 'now' },
        refreshTrigger: lastRefresh,
    });

    // Use real data if available, otherwise always fall back to mock
    const seriesData = realData.length > 0 ? realData : mockData;

    // Transform to recharts format
    const chartData = useMemo(() => {
        if (seriesData.length === 0) return [];

        // Get all unique timestamps
        const timestamps = new Set<number>();
        seriesData.forEach(series => {
            series.data.forEach(point => timestamps.add(point.timestamp));
        });

        // Sort timestamps
        const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

        // Build chart data
        return sortedTimestamps.map(ts => {
            const point: Record<string, any> = {
                time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                timestamp: ts,
            };

            seriesData.forEach(series => {
                const dataPoint = series.data.find(d => d.timestamp === ts);
                point[series.name] = dataPoint?.value ?? null;
            });

            return point;
        });
    }, [seriesData]);

    const seriesKeys = useMemo(() => {
        return seriesData.map(s => s.name);
    }, [seriesData]);

    const { anomalyData } = useAnomaly(panel.targets?.[0]?.expr);

    if (isLoading && realData.length === 0 && mockData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    const isAnomalous = anomalyData?.isAnomalous;

    return (
        <div className={cn(
            "w-full h-full p-2 relative group",
            isAnomalous && "after:absolute after:inset-0 after:border-2 after:border-amber-500/20 after:rounded-xl after:animate-pulse after:pointer-events-none"
        )} style={{ minHeight: '150px' }}>
            {isAnomalous && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-bounce">
                    <Activity size={10} />
                    ANOMALY DETECTED
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: showLegend ? 30 : 5 }}>
                    <defs>
                        {seriesKeys.map((key, idx) => (
                            <linearGradient key={key} id={`gradient-${panel.id}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />

                    <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        tickFormatter={(value) => {
                            const unit = panel.fieldConfig?.defaults?.unit;
                            if (unit === 'percent') return `${value}%`;
                            if (unit === 'ms') return `${value}ms`;
                            if (unit === 's') return `${value}s`;
                            if (unit === 'bytes') return formatBytes(value);
                            return value.toFixed(0);
                        }}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#141417',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                    />

                    {showLegend && (
                        <Legend
                            verticalAlign={legendPlacement === 'bottom' ? 'bottom' : 'top'}
                            height={24}
                            iconSize={10}
                            wrapperStyle={{ fontSize: '11px' }}
                        />
                    )}

                    {seriesKeys.map((key, idx) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2}
                            fill={`url(#gradient-${panel.id}-${idx})`}
                            fillOpacity={1}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default TimeSeriesWidget;
