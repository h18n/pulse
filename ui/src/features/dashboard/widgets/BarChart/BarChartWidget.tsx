"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WidgetProps } from '../registry';
import { useBarChartData } from '@/lib/hooks/useDataQuery';
import { Loader2 } from 'lucide-react';

const COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
];

export function BarChartWidget({ panel, timeRange, variables, lastRefresh }: WidgetProps) {
    const options = panel.options as Record<string, any> || {};
    const orientation = options.orientation || 'vertical';
    const showValue = options.showValue !== false;
    const barWidth = options.barWidth || 0.6;

    // Fetch bar chart data
    const { data, isLoading } = useBarChartData({
        query: panel.targets?.[0]?.expr || panel.targets?.[0]?.query,
        timeRange: timeRange || { from: 'now-6h', to: 'now' },
        refreshTrigger: lastRefresh,
        categoryCount: 5,
    });

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    const isHorizontal = orientation === 'horizontal';

    return (
        <div className="w-full h-full p-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout={isHorizontal ? 'vertical' : 'horizontal'}
                    margin={{ top: 10, right: 20, left: isHorizontal ? 60 : 10, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                    {isHorizontal ? (
                        <>
                            <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                type="number"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                        </>
                    )}

                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#141417',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />

                    <Bar
                        dataKey="value"
                        radius={[4, 4, 4, 4]}
                        barSize={undefined}
                        label={showValue ? {
                            position: isHorizontal ? 'right' : 'top',
                            fill: '#94a3b8',
                            fontSize: 10,
                        } : false}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default BarChartWidget;
