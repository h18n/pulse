"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { WidgetProps } from '../registry';
import { useStatusGridData } from '@/lib/hooks/useDataQuery';
import { Loader2 } from 'lucide-react';

export function StatusGridWidget({ panel, timeRange, variables, lastRefresh }: WidgetProps) {
    const options = panel.options as Record<string, any> || {};
    const columns = options.columns || 4;
    const showLabels = options.showLabels !== false;

    // Fetch status grid data
    const { items, isLoading } = useStatusGridData({
        query: panel.targets?.[0]?.expr || panel.targets?.[0]?.query,
        refreshTrigger: lastRefresh,
        itemCount: options.itemCount || 16,
    });

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return 'bg-emerald-500';
            case 'warning': return 'bg-amber-500';
            case 'critical': return 'bg-destructive animate-pulse';
            default: return 'bg-muted-foreground/50';
        }
    };

    const getStatusGlow = (status: string) => {
        switch (status) {
            case 'ok': return 'shadow-emerald-500/30';
            case 'warning': return 'shadow-amber-500/30';
            case 'critical': return 'shadow-destructive/30';
            default: return '';
        }
    };

    return (
        <div className="w-full h-full p-4 flex items-center justify-center">
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "group relative flex items-center justify-center",
                            showLabels ? "p-2" : "p-1"
                        )}
                        title={`${item.name}: ${item.status}`}
                    >
                        <div
                            className={cn(
                                "rounded-full shadow-lg transition-all duration-300",
                                getStatusColor(item.status),
                                getStatusGlow(item.status),
                                showLabels ? "w-3 h-3" : "w-4 h-4",
                                "group-hover:scale-125"
                            )}
                        />

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="font-medium">{item.name}</div>
                            <div className={cn(
                                "capitalize",
                                item.status === 'ok' && "text-emerald-500",
                                item.status === 'warning' && "text-amber-500",
                                item.status === 'critical' && "text-destructive"
                            )}>
                                {item.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StatusGridWidget;
