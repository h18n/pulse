"use client";

import React, { useMemo } from 'react';
import { WidgetProps } from '../registry';
import { useStatData } from '@/lib/hooks/useDataQuery';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Loader2, Activity, AlertTriangle } from 'lucide-react';
import { useAnomaly } from '@/lib/hooks/useAnomaly';

export function StatWidget({ panel, timeRange, variables, lastRefresh }: WidgetProps) {
    const options = panel.options as Record<string, any> || {};
    const fieldConfig = panel.fieldConfig?.defaults || {};

    const colorMode = options.colorMode || 'value';
    const graphMode = options.graphMode || 'area';
    const textSize = options.textSize || 'auto';

    // Fetch stat data
    const { value, sparkline, isLoading } = useStatData({
        expr: panel.targets?.[0]?.expr,
        timeRange: timeRange || { from: 'now-6h', to: 'now' },
        variables: variables || {},
        refreshTrigger: lastRefresh,
    });

    const { anomalyData } = useAnomaly(panel.targets?.[0]?.expr);
    const isAnomalous = anomalyData?.isAnomalous;

    // Determine color based on thresholds
    const color = useMemo(() => {
        const thresholds = fieldConfig.thresholds?.steps || [];
        if (thresholds.length === 0) return '#10b981'; // default emerald

        // Sort thresholds by value descending
        const sorted = [...thresholds].sort((a, b) => b.value - a.value);

        for (const step of sorted) {
            if (value >= step.value) {
                return getThresholdColor(step.color);
            }
        }

        return getThresholdColor(thresholds[0]?.color || 'green');
    }, [value, fieldConfig.thresholds]);

    // Format value with unit
    const formattedValue = useMemo(() => {
        const unit = fieldConfig.unit;
        const decimals = fieldConfig.decimals ?? 0;

        let formatted = value.toFixed(decimals);

        if (unit === 'percent' || unit === 'percentunit') {
            return `${formatted}%`;
        }
        if (unit === 'ms') return `${formatted}ms`;
        if (unit === 's') return `${formatted}s`;
        if (unit === 'bytes') return formatBytes(value);
        if (unit === 'short') return formatShort(value);

        // Compact large numbers
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }

        return formatted;
    }, [value, fieldConfig]);

    // Calculate trend
    const trend = useMemo(() => {
        if (sparkline.length < 2) return null;
        const first = sparkline[0];
        const last = sparkline[sparkline.length - 1];
        const change = ((last - first) / first) * 100;
        return {
            value: change,
            direction: change >= 0 ? 'up' : 'down',
        };
    }, [sparkline]);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Sparkline background */}
            {graphMode === 'area' && sparkline.length > 0 && (
                <div className="absolute inset-0 opacity-20">
                    <Sparkline data={sparkline} color={color} />
                </div>
            )}

            {/* Main value */}
            <div
                className={cn(
                    "font-bold tracking-tight z-10 transition-all duration-500",
                    textSize === 'auto' && "text-4xl",
                    colorMode === 'value' && "transition-colors",
                    isAnomalous && "scale-110 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                )}
                style={{ color: !isAnomalous && colorMode === 'value' ? color : undefined }}
            >
                {formattedValue}
            </div>

            {/* Anomaly Badge */}
            {isAnomalous && (
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase tracking-widest mt-1 mb-2 z-10 animate-pulse bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <AlertTriangle size={12} />
                    Statistical Outlier Detected
                </div>
            )}

            {/* Trend indicator */}
            {!isAnomalous && trend && (
                <div className={cn(
                    "flex items-center gap-1 text-sm mt-2 z-10",
                    trend.direction === 'up' ? 'text-emerald-500' : 'text-destructive'
                )}>
                    {trend.direction === 'up' ? (
                        <TrendingUp size={14} />
                    ) : (
                        <TrendingDown size={14} />
                    )}
                    <span>{Math.abs(trend.value).toFixed(1)}%</span>
                </div>
            )}

            {/* Unit label */}
            {fieldConfig.unit && (
                <div className="text-xs text-muted-foreground mt-1 z-10">
                    {fieldConfig.unit}
                </div>
            )}
        </div>
    );
}

// Simple sparkline component
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const height = 100;
    const width = 200;
    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const areaPath = `M0,${height} L${points} L${width},${height} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <path
                d={areaPath}
                fill={color}
                opacity="0.3"
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                opacity="0.5"
            />
        </svg>
    );
}

function getThresholdColor(color: string): string {
    const colorMap: Record<string, string> = {
        green: '#10b981',
        yellow: '#f59e0b',
        orange: '#f97316',
        red: '#ef4444',
        blue: '#3b82f6',
        purple: '#8b5cf6',
    };
    return colorMap[color] || color;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatShort(value: number): string {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
}

export default StatWidget;
