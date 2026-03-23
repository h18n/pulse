"use client";

import React, { useMemo } from 'react';
import { WidgetProps } from '../registry';
import { useGaugeData } from '@/lib/hooks/useDataQuery';
import { Loader2 } from 'lucide-react';

export function GaugeWidget({ panel, timeRange, variables, lastRefresh }: WidgetProps) {
    const options = panel.options as Record<string, any> || {};
    const fieldConfig = panel.fieldConfig?.defaults || {};

    const min = fieldConfig.min ?? 0;
    const max = fieldConfig.max ?? 100;
    const showThresholdMarkers = options.showThresholdMarkers ?? true;

    // Fetch gauge data
    const { value, isLoading } = useGaugeData({
        expr: panel.targets?.[0]?.expr,
        min,
        max,
        refreshTrigger: lastRefresh,
    });

    // Get thresholds
    const thresholds = useMemo(() => {
        return fieldConfig.thresholds?.steps || [
            { value: 0, color: 'green' },
            { value: 70, color: 'yellow' },
            { value: 90, color: 'red' },
        ];
    }, [fieldConfig.thresholds]);

    // Calculate gauge color based on value
    const currentColor = useMemo(() => {
        const sorted = [...thresholds].sort((a, b) => b.value - a.value);
        for (const step of sorted) {
            if (value >= step.value) {
                return getThresholdColor(step.color);
            }
        }
        return getThresholdColor(thresholds[0]?.color || 'green');
    }, [value, thresholds]);

    // Calculate percentage
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    // Format value with unit
    const formattedValue = useMemo(() => {
        const unit = fieldConfig.unit;
        const decimals = fieldConfig.decimals ?? 0;
        let formatted = value.toFixed(decimals);
        if (unit === 'percent') return `${formatted}%`;
        if (unit === 'ms') return `${formatted}ms`;
        return formatted;
    }, [value, fieldConfig]);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    // Arc parameters - responsive sizing
    const size = 140;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const startAngle = 135;
    const endAngle = 405;
    const angleRange = endAngle - startAngle;

    // Calculate arc path
    const polarToCartesian = (angle: number) => {
        const rad = (angle - 90) * (Math.PI / 180);
        return {
            x: center + radius * Math.cos(rad),
            y: center + radius * Math.sin(rad),
        };
    };

    const createArc = (start: number, end: number) => {
        const s = polarToCartesian(start);
        const e = polarToCartesian(end);
        const largeArc = end - start > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    };

    const valueAngle = startAngle + (percentage / 100) * angleRange;
    const backgroundArc = createArc(startAngle, endAngle);
    const valueArc = createArc(startAngle, Math.max(startAngle + 1, valueAngle));

    return (
        <div className="w-full h-full flex items-center justify-center p-2 overflow-hidden">
            <div className="relative flex flex-col items-center" style={{ maxWidth: size, maxHeight: size }}>
                <svg
                    viewBox={`0 0 ${size} ${size * 0.65}`}
                    className="w-full"
                    style={{ maxWidth: size, maxHeight: size * 0.65 }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background arc */}
                    <path
                        d={backgroundArc}
                        fill="none"
                        stroke="#27272a"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Threshold markers */}
                    {showThresholdMarkers && thresholds.map((step, idx) => {
                        if (step.value === 0) return null;
                        const stepPercent = ((step.value - min) / (max - min)) * 100;
                        const stepAngle = startAngle + (stepPercent / 100) * angleRange;
                        const pos = polarToCartesian(stepAngle);
                        return (
                            <circle
                                key={idx}
                                cx={pos.x}
                                cy={pos.y}
                                r={2}
                                fill={getThresholdColor(step.color)}
                            />
                        );
                    })}

                    {/* Value arc */}
                    <path
                        d={valueArc}
                        fill="none"
                        stroke={currentColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        style={{
                            filter: `drop-shadow(0 0 6px ${currentColor}40)`,
                        }}
                    />

                    {/* Value text */}
                    <text
                        x={center}
                        y={center + 5}
                        textAnchor="middle"
                        className="fill-foreground font-bold"
                        style={{ fontSize: '24px' }}
                    >
                        {formattedValue}
                    </text>
                </svg>
            </div>
        </div>
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

export default GaugeWidget;
