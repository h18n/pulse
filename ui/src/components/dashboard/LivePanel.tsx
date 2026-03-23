'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocketStore } from '@/lib/websocket';
import type { Panel } from '@/types/dashboard';

interface LivePanelProps {
    panel: Panel;
    className?: string;
}

// Simulated real-time data for demo purposes
function useSimulatedData(panelId: string, panelType: string) {
    const [value, setValue] = useState<number>(0);
    const [previousValue, setPreviousValue] = useState<number>(0);
    const [history, setHistory] = useState<number[]>([]);
    const { isConnected } = useWebSocketStore();

    useEffect(() => {
        if (!isConnected) return;

        // Generate initial value based on panel type
        const baseValue = panelType === 'stat' ? Math.random() * 1000 : Math.random() * 100;
        setValue(baseValue);
        setHistory(Array.from({ length: 20 }, () => baseValue + (Math.random() - 0.5) * 50));

        const interval = setInterval(() => {
            setPreviousValue(value);
            setValue((prev) => {
                const change = (Math.random() - 0.5) * (prev * 0.1);
                const newValue = Math.max(0, prev + change);
                setHistory((h) => [...h.slice(-19), newValue]);
                return newValue;
            });
        }, 2000 + Math.random() * 1000); // randomize update interval

        return () => clearInterval(interval);
    }, [panelId, panelType, isConnected]);

    const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable';
    const changePercent = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;

    return { value, previousValue, history, trend, changePercent, isConnected };
}

// Live Stat Panel
export function LiveStatPanel({ panel, className }: LivePanelProps) {
    const { value, trend, changePercent, isConnected } = useSimulatedData(panel.id, 'stat');

    return (
        <div className={cn("relative p-4 h-full flex flex-col items-center justify-center", className)}>
            {/* Live indicator */}
            {isConnected && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-500">LIVE</span>
                </div>
            )}

            {/* Value */}
            <div className="text-4xl font-bold text-primary">
                {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>

            {/* Trend */}
            <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            )}>
                {trend === 'up' && <TrendingUp size={16} />}
                {trend === 'down' && <TrendingDown size={16} />}
                {trend === 'stable' && <Minus size={16} />}
                <span>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
            </div>

            {/* Query info */}
            <div className="text-xs text-muted-foreground mt-2 truncate max-w-full">
                {panel.targets[0]?.expr || 'No query'}
            </div>
        </div>
    );
}

// Live Time Series Panel (mini sparkline)
export function LiveTimeSeriesPanel({ panel, className }: LivePanelProps) {
    const { value, history, isConnected } = useSimulatedData(panel.id, 'timeseries');

    const maxValue = Math.max(...history, 1);
    const minValue = Math.min(...history, 0);
    const range = maxValue - minValue || 1;

    return (
        <div className={cn("relative p-4 h-full flex flex-col", className)}>
            {/* Live indicator */}
            {isConnected && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
            )}

            {/* Current value */}
            <div className="text-2xl font-bold mb-2">
                {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>

            {/* Sparkline */}
            <div className="flex-1 flex items-end gap-0.5 min-h-[60px]">
                {history.map((v, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex-1 rounded-t transition-all duration-500",
                            i === history.length - 1 ? "bg-primary" : "bg-primary/60"
                        )}
                        style={{
                            height: `${((v - minValue) / range) * 100}%`,
                            minHeight: '2px',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// Live Gauge Panel
export function LiveGaugePanel({ panel, className }: LivePanelProps) {
    const { value, isConnected } = useSimulatedData(panel.id, 'gauge');

    const percentage = Math.min(100, Math.max(0, value));
    const rotation = (percentage / 100) * 180 - 90;

    // Color based on value
    const getColor = (val: number) => {
        if (val >= 90) return 'text-destructive';
        if (val >= 70) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <div className={cn("relative p-4 h-full flex flex-col items-center justify-center", className)}>
            {/* Live indicator */}
            {isConnected && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
            )}

            {/* Gauge */}
            <div className="relative w-24 h-12 overflow-hidden">
                {/* Background arc */}
                <div className="absolute bottom-0 left-0 right-0 h-24 border-8 border-muted rounded-full border-b-transparent" />

                {/* Value arc */}
                <div
                    className={cn("absolute bottom-0 left-0 right-0 h-24 border-8 rounded-full border-b-transparent transition-all duration-500", getColor(percentage))}
                    style={{
                        clipPath: `polygon(0 100%, 100% 100%, 100% ${100 - percentage}%, 0 ${100 - percentage}%)`,
                        borderColor: 'currentColor',
                        borderBottomColor: 'transparent',
                    }}
                />

                {/* Needle */}
                <div
                    className="absolute bottom-0 left-1/2 w-1 h-10 bg-foreground origin-bottom transition-transform duration-500"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                />
            </div>

            {/* Value */}
            <div className={cn("text-2xl font-bold mt-2", getColor(percentage))}>
                {percentage.toFixed(0)}%
            </div>
        </div>
    );
}

// Main Live Panel wrapper
export function LivePanel({ panel, className }: LivePanelProps) {
    switch (panel.type) {
        case 'stat':
            return <LiveStatPanel panel={panel} className={className} />;
        case 'timeseries':
            return <LiveTimeSeriesPanel panel={panel} className={className} />;
        case 'gauge':
            return <LiveGaugePanel panel={panel} className={className} />;
        default:
            return (
                <div className={cn("p-4 h-full flex items-center justify-center", className)}>
                    <Activity size={24} className="text-muted-foreground" />
                </div>
            );
    }
}

export default LivePanel;
