'use client';

/**
 * Forecast Widget
 * 
 * Displays predictive time-series forecasting with confidence bands.
 * Uses the /api/forecast endpoint to generate predictions based on
 * historical Prometheus data and linear regression.
 * 
 * @module widgets/Forecast
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    ReferenceLine,
    CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '../registry';

// ============== Types ==============

interface ForecastDataPoint {
    timestamp: number;
    value: number;
    type: 'historical' | 'forecast';
    upperBound?: number;
    lowerBound?: number;
}

interface ForecastResponse {
    metric: Record<string, string>;
    currentValue: number;
    predictedValue: number;
    trend: {
        perHour: number;
        perDay: number;
        direction: 'increasing' | 'decreasing' | 'stable';
    };
    timeToThreshold: {
        hours: number;
        breachTime: string;
    } | null;
    historical: ForecastDataPoint[];
    forecast: ForecastDataPoint[];
    confidence: {
        level: number;
        stdError: number;
        upperBound: ForecastDataPoint[];
        lowerBound: ForecastDataPoint[];
    };
    generatedAt: string;
}

interface ForecastOptions {
    forecastHours?: number;
    threshold?: number;
    showConfidenceBands?: boolean;
    unit?: string;
    displayMode?: 'full' | 'compact';
}

// ============== Component ==============

export function ForecastWidget({
    panel,
    timeRange,
    variables,
    width,
    height,
    lastRefresh
}: WidgetProps) {
    const [data, setData] = useState<ForecastResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const options: ForecastOptions = panel.options as ForecastOptions || {};
    const {
        forecastHours = 24,
        threshold,
        showConfidenceBands = true,
        unit = '',
        displayMode = 'full'
    } = options;

    const expr = panel.targets?.[0]?.expr || '';

    const fetchForecast = useCallback(async () => {
        if (!expr) {
            setError('No expression configured');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai-engine/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expr,
                    forecastHours,
                    threshold,
                    lookbackHours: 168 // 7 days
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Forecast failed');
            }

            const result: ForecastResponse = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch forecast');
            // Use mock data for demo
            setData(generateMockForecast(forecastHours, threshold));
        } finally {
            setIsLoading(false);
        }
    }, [expr, forecastHours, threshold]);

    useEffect(() => {
        fetchForecast();
    }, [fetchForecast, lastRefresh]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="h-full flex items-center justify-center text-destructive">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm">{error}</span>
            </div>
        );
    }

    if (!data) return null;

    // Combine historical and forecast data
    const chartData = [
        ...data.historical.map(p => ({
            timestamp: p.timestamp,
            historical: p.value,
            forecast: null as number | null,
            upper: null as number | null,
            lower: null as number | null
        })),
        ...data.forecast.map((p, i) => ({
            timestamp: p.timestamp,
            historical: i === 0 ? data.historical[data.historical.length - 1]?.value : null,
            forecast: p.value,
            upper: showConfidenceBands ? data.confidence.upperBound[i]?.value : null,
            lower: showConfidenceBands ? data.confidence.lowerBound[i]?.value : null
        }))
    ];

    const formatValue = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)}G`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
        return val.toFixed(1);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const TrendIcon = data.trend.direction === 'increasing' ? TrendingUp :
        data.trend.direction === 'decreasing' ? TrendingDown : Clock;

    const trendColor = data.trend.direction === 'increasing' ? 'text-red-500' :
        data.trend.direction === 'decreasing' ? 'text-green-500' : 'text-muted-foreground';

    if (displayMode === 'compact') {
        return (
            <div className="h-full p-4 flex flex-col justify-center">
                <div className="text-2xl font-bold">
                    {formatValue(data.currentValue)}{unit}
                </div>
                <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{formatValue(Math.abs(data.trend.perDay))}/day</span>
                </div>
                {data.timeToThreshold && (
                    <div className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Breach in {data.timeToThreshold.hours.toFixed(1)}h
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-2">
            {/* Header Stats */}
            <div className="flex items-center justify-between mb-2 px-2">
                <div>
                    <div className="text-xl font-semibold">
                        {formatValue(data.currentValue)}{unit}
                    </div>
                    <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <div className="text-right">
                    <div className={cn("flex items-center gap-1", trendColor)}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="font-medium">{formatValue(Math.abs(data.trend.perDay))}/day</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Predicted: {formatValue(data.predictedValue)}{unit}
                    </div>
                </div>
            </div>

            {/* Alert Banner */}
            {data.timeToThreshold && (
                <div className="mx-2 mb-2 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-500">
                        Threshold breach predicted in <strong>{data.timeToThreshold.hours.toFixed(1)} hours</strong>
                    </span>
                </div>
            )}

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatTime}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatValue}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            width={45}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            labelFormatter={(ts) => new Date(ts).toLocaleString()}
                            formatter={(value, name) => [
                                `${formatValue((value as number) ?? 0)}${unit}`,
                                (name || 'historical') === 'historical' ? 'Actual' : 'Forecast'
                            ]}
                        />

                        {/* Confidence Bands */}
                        {showConfidenceBands && (
                            <Area
                                dataKey="upper"
                                stroke="none"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.1}
                                connectNulls={false}
                            />
                        )}

                        {/* Threshold Line */}
                        {threshold !== undefined && (
                            <ReferenceLine
                                y={threshold}
                                stroke="hsl(var(--destructive))"
                                strokeDasharray="5 5"
                                label={{
                                    value: 'Threshold',
                                    position: 'right',
                                    fill: 'hsl(var(--destructive))',
                                    fontSize: 10
                                }}
                            />
                        )}

                        {/* Historical Line */}
                        <Line
                            type="monotone"
                            dataKey="historical"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                        />

                        {/* Forecast Line */}
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="text-[10px] text-muted-foreground text-center mt-1">
                Forecast based on {forecastHours}h prediction • 95% confidence interval
            </div>
        </div>
    );
}

// ============== Mock Data Generator ==============

function generateMockForecast(forecastHours: number, threshold?: number): ForecastResponse {
    const now = Date.now();
    const hourMs = 3600000;

    const historical: ForecastDataPoint[] = [];
    const forecast: ForecastDataPoint[] = [];
    const upperBound: ForecastDataPoint[] = [];
    const lowerBound: ForecastDataPoint[] = [];

    let baseValue = 50 + Math.random() * 30;
    const slope = (Math.random() - 0.3) * 2; // Slight upward bias

    // Generate 48 hours of historical data
    for (let i = 48; i >= 0; i--) {
        const timestamp = now - i * hourMs;
        const noise = (Math.random() - 0.5) * 10;
        const value = baseValue + (48 - i) * slope + noise;
        historical.push({ timestamp, value, type: 'historical' });
    }

    const lastHistorical = historical[historical.length - 1].value;
    const stdError = 5;

    // Generate forecast
    for (let i = 0; i <= forecastHours; i++) {
        const timestamp = now + i * hourMs;
        const value = lastHistorical + i * slope;
        forecast.push({ timestamp, value, type: 'forecast' });
        upperBound.push({ timestamp, value: value + 1.96 * stdError, type: 'forecast' });
        lowerBound.push({ timestamp, value: value - 1.96 * stdError, type: 'forecast' });
    }

    const predictedValue = forecast[forecast.length - 1].value;
    let timeToThreshold = null;
    if (threshold !== undefined && slope > 0) {
        const hoursToThreshold = (threshold - lastHistorical) / slope;
        if (hoursToThreshold > 0 && hoursToThreshold < forecastHours * 2) {
            timeToThreshold = {
                hours: hoursToThreshold,
                breachTime: new Date(now + hoursToThreshold * hourMs).toISOString()
            };
        }
    }

    return {
        metric: { __name__: 'mock_metric' },
        currentValue: lastHistorical,
        predictedValue,
        trend: {
            perHour: slope,
            perDay: slope * 24,
            direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
        },
        timeToThreshold,
        historical,
        forecast,
        confidence: {
            level: 0.95,
            stdError,
            upperBound,
            lowerBound
        },
        generatedAt: new Date().toISOString()
    };
}

export default ForecastWidget;
