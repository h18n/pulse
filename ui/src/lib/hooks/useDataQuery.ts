// Data Fetching Hooks for Dashboard Widgets

import { useState, useEffect, useCallback, useRef } from "react";
import {
    DataQueryRequest,
    DataQueryResponse,
    TimeRange as DSTimeRange,
    Series,
    parseRelativeTime,
    interpolateVariables
} from "@/lib/datasources";
import { useDashboardStore } from "@/stores/dashboardStore";


interface UseDataQueryOptions {
    targets: Array<{
        refId?: string;
        expr?: string;
        query?: string;
        type?: 'metrics' | 'logs';
        legendFormat?: string;
        limit?: number;
    }>;
    timeRange: { from: string; to: string };
    variables?: Record<string, string | string[]>;
    refreshInterval?: number; // ms
    maxDataPoints?: number;
    enabled?: boolean;
    datasourceType?: "prometheus" | "elasticsearch";
}

interface UseDataQueryResult {
    data: Series[];
    logs: any[];
    isLoading: boolean;
    error: string | null;
    lastRefresh: number;
    refresh: () => void;
}

// Simple in-memory cache
const queryCache = new Map<string, { data: Series[]; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

function getCacheKey(options: UseDataQueryOptions): string {
    return JSON.stringify({
        targets: options.targets,
        timeRange: options.timeRange,
        variables: options.variables,
        datasourceType: options.datasourceType,
    });
}

export function useDataQuery(options: UseDataQueryOptions): UseDataQueryResult {
    const {
        targets,
        timeRange,
        variables = {},
        refreshInterval = 0,
        maxDataPoints = 500,
        enabled = true,
        datasourceType = "prometheus",
    } = options;

    const [data, setData] = useState<Series[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const scrubbedTime = useDashboardStore(s => s.scrubbedTime);
    const isScrubbing = useDashboardStore(s => s.isScrubbing);

    const targetsKey = JSON.stringify(targets);
    const timeRangeKey = JSON.stringify(timeRange);
    const variablesKey = JSON.stringify(variables);

    const fetchData = useCallback(async () => {
        if (!enabled || targets.length === 0) return;

        // Check cache first
        const cacheKey = getCacheKey({ targets, timeRange, variables, datasourceType });
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setData(cached.data);
            setLastRefresh(cached.timestamp);
            return;
        }

        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            // Interpolate variables in queries
            const interpolatedTargets = targets.map((target) => ({
                ...target,
                expr: target.expr ? interpolateVariables(target.expr, variables) : undefined,
                query: target.query ? interpolateVariables(target.query, variables) : undefined,
            }));

            // Handle Time Travel (Chronos Scrubber)
            let finalTimeRange = { ...timeRange };
            if (isScrubbing && scrubbedTime) {
                const toMs = scrubbedTime;

                // Calculate duration from original range
                const startMs = parseRelativeTime(timeRange.from);
                const endMs = parseRelativeTime(timeRange.to);
                const duration = endMs - startMs;

                finalTimeRange = {
                    from: new Date(toMs - duration).toISOString(),
                    to: new Date(toMs).toISOString()
                };
            }

            const response = await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    datasource: { type: datasourceType },
                    targets: interpolatedTargets,
                    range: finalTimeRange,
                    maxDataPoints,
                    intervalMs: calculateIntervalMs(finalTimeRange, maxDataPoints),
                }),
                signal: abortControllerRef.current.signal,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Query failed");
            }

            // Update cache
            queryCache.set(cacheKey, {
                data: result.data || [],
                timestamp: Date.now(),
            });

            setData(result.data || []);
            setLogs(result.logs || []);
            setLastRefresh(Date.now());
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            setError(err instanceof Error ? err.message : "Query failed");
        } finally {
            setIsLoading(false);
        }
    }, [enabled, targetsKey, timeRangeKey, variablesKey, maxDataPoints, datasourceType, isScrubbing, scrubbedTime]);


    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh interval
    useEffect(() => {
        if (refreshInterval <= 0 || !enabled) return;

        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, enabled, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        data,
        logs,
        isLoading,
        error,
        lastRefresh,
        refresh: fetchData,
    };
}

// Calculate interval in milliseconds based on time range
function calculateIntervalMs(
    timeRange: { from: string; to: string },
    maxDataPoints: number
): number {
    const from = parseRelativeTime(timeRange.from);
    const to = parseRelativeTime(timeRange.to);
    const rangeMs = to - from;
    return Math.max(Math.ceil(rangeMs / maxDataPoints), 15000);
}

// ============== Mock Data Hook (Fallback) ==============

interface MockDataOptions {
    panelType: string;
    seriesCount?: number;
    pointCount?: number;
    timeRange: { from: string; to: string };
    refreshTrigger?: number;
}

export function useMockData(options: MockDataOptions): Series[] {
    const { panelType, seriesCount = 2, pointCount = 24, timeRange, refreshTrigger } = options;
    const [data, setData] = useState<Series[]>([]);

    useEffect(() => {
        const fromTs = parseRelativeTime(timeRange.from);
        const toTs = parseRelativeTime(timeRange.to);
        const interval = (toTs - fromTs) / pointCount;

        const series: Series[] = [];

        for (let s = 0; s < seriesCount; s++) {
            const points = [];
            const baseValue = Math.random() * 50 + 25;

            for (let i = 0; i < pointCount; i++) {
                const timestamp = fromTs + i * interval;
                const value = baseValue + Math.sin(i * 0.3 + s) * 20 + (Math.random() - 0.5) * 10;
                points.push({ timestamp, value: Math.max(0, value) });
            }

            series.push({
                name: `Series ${String.fromCharCode(65 + s)}`,
                labels: { series: String(s + 1) },
                data: points,
            });
        }

        setData(series);
    }, [timeRange.from, timeRange.to, seriesCount, pointCount, refreshTrigger]);

    return data;
}

// ============== Stat Value Hook ==============

interface StatDataOptions {
    expr?: string;
    timeRange: { from: string; to: string };
    variables?: Record<string, string | string[]>;
    refreshTrigger?: number;
}

export function useStatData(options: StatDataOptions) {
    const { expr, timeRange, variables = {}, refreshTrigger } = options;
    const [value, setValue] = useState<number>(0);
    const [sparkline, setSparkline] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!expr) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        datasource: { type: "prometheus" },
                        targets: [{ refId: "A", expr: interpolateVariables(expr, variables) }],
                        range: timeRange,
                        maxDataPoints: 50,
                    }),
                });

                if (!response.ok) throw new Error("API failed");
                const result = await response.json();

                if (result.data && result.data[0] && result.data[0].data.length > 0) {
                    const series = result.data[0].data;
                    const latest = series[series.length - 1].value;
                    const spark = series.slice(-12).map((p: any) => p.value);
                    setValue(latest);
                    setSparkline(spark);
                } else {
                    throw new Error("No data");
                }
            } catch (err) {
                // Fallback to mock data if real API fails
                const mockValue = Math.floor(Math.random() * 1000);
                const mockSparkline = Array.from({ length: 12 }, () =>
                    Math.random() * 100
                );
                setValue(mockValue);
                setSparkline(mockSparkline);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [expr, JSON.stringify(timeRange), JSON.stringify(variables), refreshTrigger]);

    return { value, sparkline, isLoading, error };
}

// ============== Table Data Hook ==============

interface TableDataOptions {
    query?: string;
    timeRange: { from: string; to: string };
    variables?: Record<string, string | string[]>;
    refreshTrigger?: number;
    limit?: number;
}

export function useTableData(options: TableDataOptions) {
    const { query, timeRange, variables = {}, refreshTrigger, limit = 100 } = options;
    const [columns, setColumns] = useState<string[]>([]);
    const [rows, setRows] = useState<(string | number)[][]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        datasource: { type: query?.includes("{") ? "elasticsearch" : "prometheus" },
                        targets: [{ refId: "A", expr: interpolateVariables(query || "", variables), query: interpolateVariables(query || "", variables) }],
                        range: timeRange,
                        maxDataPoints: limit,
                    }),
                });

                if (!response.ok) throw new Error("API failed");
                const result = await response.json();

                if (result.data && result.data.length > 0) {
                    // Get all unique label keys for columns
                    const labelKeysSet = new Set<string>();
                    result.data.forEach((series: Series) => {
                        Object.keys(series.labels || {}).forEach(k => labelKeysSet.add(k));
                    });
                    const labelKeys = Array.from(labelKeysSet);

                    const cols = ["Name", ...labelKeys, "Value"];

                    const tableRows = result.data.map((series: Series) => {
                        const latestPoint = series.data[series.data.length - 1];
                        return [
                            series.name || "unnamed",
                            ...labelKeys.map(k => (series.labels || {})[k] || "-"),
                            latestPoint ? latestPoint.value : 0
                        ];
                    });

                    setColumns(cols);
                    setRows(tableRows);
                } else {
                    throw new Error("No data");
                }
            } catch (err) {
                // Mock table data
                const mockColumns = ["Name", "Status", "Latency", "Requests", "Errors"];
                const statusOptions = ["OK", "Warning", "Critical"];
                const mockRows = Array.from({ length: 20 }, (_, i) => [
                    `device-${i + 1}`,
                    statusOptions[Math.floor(Math.random() * 3)],
                    `${Math.floor(Math.random() * 200)}ms`,
                    Math.floor(Math.random() * 10000),
                    Math.floor(Math.random() * 100),
                ]);

                setColumns(mockColumns);
                setRows(mockRows);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [query, JSON.stringify(timeRange), JSON.stringify(variables), refreshTrigger, limit]);

    return { columns, rows, isLoading, error };
}

// ============== Gauge Value Hook ==============

interface GaugeDataOptions {
    expr?: string;
    min?: number;
    max?: number;
    refreshTrigger?: number;
}

export function useGaugeData(options: GaugeDataOptions) {
    const { expr, min = 0, max = 100, refreshTrigger } = options;
    const [value, setValue] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Mock gauge value
        const mockValue = min + Math.random() * (max - min);
        setValue(mockValue);
    }, [expr, min, max, refreshTrigger]);

    return { value, min, max, isLoading };
}

// ============== Status Grid Data Hook ==============

interface StatusItem {
    name: string;
    status: "ok" | "warning" | "critical" | "unknown";
}

interface StatusGridDataOptions {
    query?: string;
    refreshTrigger?: number;
    itemCount?: number;
}

export function useStatusGridData(options: StatusGridDataOptions) {
    const { query, refreshTrigger, itemCount = 16 } = options;
    const [items, setItems] = useState<StatusItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const statuses: Array<"ok" | "warning" | "critical" | "unknown"> =
            ["ok", "warning", "critical", "unknown"];

        const mockItems = Array.from({ length: itemCount }, (_, i) => ({
            name: `node-${i + 1}`,
            status: statuses[Math.floor(Math.random() * 4)] as StatusItem["status"],
        }));

        setItems(mockItems);
    }, [query, refreshTrigger, itemCount]);

    return { items, isLoading };
}

// ============== Bar Chart Data Hook ==============

interface BarChartDataOptions {
    query?: string;
    timeRange: { from: string; to: string };
    refreshTrigger?: number;
    categoryCount?: number;
}

export function useBarChartData(options: BarChartDataOptions) {
    const { query, timeRange, refreshTrigger, categoryCount = 5 } = options;
    const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const categories = ["US-EAST", "US-WEST", "EU-WEST", "APAC", "SA-EAST"];
        const mockData = categories.slice(0, categoryCount).map((cat) => ({
            name: cat,
            value: Math.floor(Math.random() * 1000),
        }));

        setData(mockData);
    }, [query, JSON.stringify(timeRange), refreshTrigger, categoryCount]);

    return { data, isLoading };
}
