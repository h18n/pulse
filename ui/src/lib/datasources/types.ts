// Data Source Registry and Interfaces

export interface TimeRange {
    from: string; // ISO string or relative time like "now-1h"
    to: string;
}

export interface DataQuery {
    refId: string;
    expr?: string; // PromQL
    query?: string; // Elasticsearch/generic
    type?: 'metrics' | 'logs'; // Query type
    legendFormat?: string;
    limit?: number;
    interval?: string;
}

export interface DataQueryRequest {
    targets: DataQuery[];
    range: TimeRange;
    intervalMs: number;
    maxDataPoints: number;
    scopedVars?: Record<string, { value: string }>;
}

export interface DataPoint {
    timestamp: number;
    value: number;
}

export interface Series {
    name: string;
    labels: Record<string, string>;
    data: DataPoint[];
}

export interface DataQueryResponse {
    data: Series[];
    logs?: any[]; // Raw log entries/documents
    error?: string;
}

export interface DataSource {
    id: string;
    type: string;
    name: string;
    url: string;

    query(request: DataQueryRequest): Promise<DataQueryResponse>;
    testConnection(): Promise<{ success: boolean; message: string }>;
    metricFindQuery?(query: string): Promise<Array<{ text: string; value: string }>>;
}

// Parse relative time strings like "now-1h" to timestamps
export function parseRelativeTime(timeStr: string): number {
    const now = Date.now();

    if (timeStr === "now") return now;

    // Handle relative times like now-1h, now-6h, now-7d
    const match = timeStr.match(/^now-(\d+)([smhdw])$/);
    if (match) {
        const [, amount, unit] = match;
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };
        return now - parseInt(amount) * (multipliers[unit] || 0);
    }

    // Handle date boundaries like now/d (start of day)
    const boundaryMatch = timeStr.match(/^now\/([dwM])$/);
    if (boundaryMatch) {
        const date = new Date();
        switch (boundaryMatch[1]) {
            case "d":
                date.setHours(0, 0, 0, 0);
                break;
            case "w":
                date.setDate(date.getDate() - date.getDay());
                date.setHours(0, 0, 0, 0);
                break;
            case "M":
                date.setDate(1);
                date.setHours(0, 0, 0, 0);
                break;
        }
        return date.getTime();
    }

    // Try to parse as ISO date
    const parsed = Date.parse(timeStr);
    if (!isNaN(parsed)) return parsed;

    return now;
}

// Calculate step based on time range and max data points
export function calculateStep(from: number, to: number, maxDataPoints: number): number {
    const rangeSeconds = (to - from) / 1000;
    const step = Math.max(Math.ceil(rangeSeconds / maxDataPoints), 15);
    return step;
}

// Interpolate variables in query string
export function interpolateVariables(
    query: string,
    variables: Record<string, string | string[]>
): string {
    let result = query;

    for (const [name, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\$${name}`, "g");
        const replacement = Array.isArray(value)
            ? value.join("|")
            : value;
        result = result.replace(regex, replacement);
    }

    return result;
}
