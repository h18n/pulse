"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { WidgetProps } from '../registry';
import { useTableData } from '@/lib/hooks/useDataQuery';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function TableWidget({ panel, timeRange, variables, lastRefresh }: WidgetProps) {
    const options = panel.options as Record<string, any> || {};
    const showHeader = options.showHeader !== false;
    const cellHeight = options.cellHeight || 'sm';

    const [sortColumn, setSortColumn] = React.useState<number | null>(null);
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

    // Fetch table data
    const { columns, rows, isLoading } = useTableData({
        query: panel.targets?.[0]?.query || panel.targets?.[0]?.expr,
        timeRange: timeRange || { from: 'now-6h', to: 'now' },
        variables: variables || {},
        refreshTrigger: lastRefresh,
    });

    // Handle sorting
    const handleSort = (colIdx: number) => {
        if (sortColumn === colIdx) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(colIdx);
            setSortDirection('asc');
        }
    };

    // Sort rows
    const sortedRows = React.useMemo(() => {
        if (sortColumn === null) return rows;

        return [...rows].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // String comparison
            const aStr = String(aVal);
            const bStr = String(bVal);
            return sortDirection === 'asc'
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        });
    }, [rows, sortColumn, sortDirection]);

    const getCellHeight = () => {
        switch (cellHeight) {
            case 'xs': return 'py-1';
            case 'sm': return 'py-2';
            case 'md': return 'py-3';
            case 'lg': return 'py-4';
            default: return 'py-2';
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            {showHeader && (
                <div className="flex items-center border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                    {columns.map((col, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "flex-1 px-3 text-left flex items-center gap-1 hover:bg-muted/50 transition-colors",
                                getCellHeight()
                            )}
                            onClick={() => handleSort(idx)}
                        >
                            {col}
                            {sortColumn === idx ? (
                                sortDirection === 'asc' ? (
                                    <ArrowUp size={12} />
                                ) : (
                                    <ArrowDown size={12} />
                                )
                            ) : (
                                <ArrowUpDown size={12} className="opacity-30" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-auto">
                {sortedRows.map((row, rowIdx) => (
                    <div
                        key={rowIdx}
                        className={cn(
                            "flex items-center border-b border-border/50 text-sm hover:bg-muted/40 transition-colors",
                            rowIdx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                        )}
                    >
                        {row.map((cell, cellIdx) => (
                            <div
                                key={cellIdx}
                                className={cn(
                                    "flex-1 px-3 truncate",
                                    getCellHeight(),
                                    cellIdx === 0 && "font-medium"
                                )}
                            >
                                <CellRenderer value={cell} />
                            </div>
                        ))}
                    </div>
                ))}

                {sortedRows.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                        No data
                    </div>
                )}
            </div>
        </div>
    );
}

// Cell renderer with status badges
function CellRenderer({ value }: { value: string | number }) {
    const strValue = String(value);

    // Status badges
    if (strValue === 'OK' || strValue === 'ok' || strValue === 'healthy') {
        return (
            <span className="inline-flex items-center gap-1.5 text-emerald-500">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {strValue}
            </span>
        );
    }

    if (strValue === 'Warning' || strValue === 'warning' || strValue === 'degraded') {
        return (
            <span className="inline-flex items-center gap-1.5 text-amber-500">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                {strValue}
            </span>
        );
    }

    if (strValue === 'Critical' || strValue === 'critical' || strValue === 'error' || strValue === 'down') {
        return (
            <span className="inline-flex items-center gap-1.5 text-destructive">
                <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                {strValue}
            </span>
        );
    }

    return <>{value}</>;
}

export default TableWidget;
