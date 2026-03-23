/**
 * Thanos Query Service
 * 
 * Thanos is a highly available, long-term storage solution for Prometheus metrics.
 * This service provides a unified interface for querying metrics across multiple
 * Prometheus instances and regions through Thanos Query.
 */

export interface ThanosEndpoint {
    id: string;
    name: string;
    url: string;
    region: string;
    status: 'healthy' | 'degraded' | 'offline';
    lastChecked: string;
    replicaLabels?: string[];
    storeType: 'sidecar' | 'store' | 'rule' | 'receive';
}

export interface ThanosQueryOptions {
    query: string;
    start?: Date;
    end?: Date;
    step?: string;
    dedup?: boolean;
    partialResponse?: boolean;
    maxSourceResolution?: string;
    replicaLabels?: string[];
    storeMatchers?: string[];
    timeout?: string;
}

export interface ThanosQueryResult {
    status: 'success' | 'error';
    data: {
        resultType: 'matrix' | 'vector' | 'scalar' | 'string';
        result: ThanosMetricResult[];
    };
    warnings?: string[];
    stats?: {
        timings?: {
            evalTotalTime: number;
            resultSortTime: number;
            queryPreparationTime: number;
        };
        samples?: {
            totalQueryableSamples: number;
            peakSamples: number;
        };
    };
}

export interface ThanosMetricResult {
    metric: Record<string, string>;
    values?: [number, string][];
    value?: [number, string];
}

export interface ThanosStore {
    name: string;
    labels: Record<string, string>[];
    minTime: number;
    maxTime: number;
    storeType: string;
    lastCheck: string;
    lastError?: string;
}

export interface ThanosConfig {
    queryUrl: string;
    storeApiUrl?: string;
    defaultDedup?: boolean;
    defaultPartialResponse?: boolean;
    defaultTimeout?: string;
    regions: {
        id: string;
        name: string;
        prometheusUrl: string;
    }[];
}

// Default configuration
const DEFAULT_CONFIG: ThanosConfig = {
    queryUrl: process.env.NEXT_PUBLIC_THANOS_URL || 'http://localhost:10902',
    defaultDedup: true,
    defaultPartialResponse: true,
    defaultTimeout: '30s',
    regions: [
        { id: 'us-east-1', name: 'US East', prometheusUrl: 'http://prometheus-us-east:9090' },
        { id: 'us-west-2', name: 'US West', prometheusUrl: 'http://prometheus-us-west:9090' },
        { id: 'eu-west-1', name: 'EU West', prometheusUrl: 'http://prometheus-eu:9090' },
        { id: 'ap-south-1', name: 'Asia Pacific', prometheusUrl: 'http://prometheus-ap:9090' },
    ],
};

export class ThanosQueryService {
    private config: ThanosConfig;

    constructor(config: Partial<ThanosConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Execute an instant query against Thanos Query
     */
    async instantQuery(query: string, time?: Date, options: Partial<ThanosQueryOptions> = {}): Promise<ThanosQueryResult> {
        const params = new URLSearchParams({
            query,
            ...(time && { time: time.toISOString() }),
            dedup: String(options.dedup ?? this.config.defaultDedup),
            partial_response: String(options.partialResponse ?? this.config.defaultPartialResponse),
            ...(options.timeout && { timeout: options.timeout }),
            ...(options.maxSourceResolution && { max_source_resolution: options.maxSourceResolution }),
        });

        // Add replica labels if specified
        if (options.replicaLabels) {
            options.replicaLabels.forEach(label => params.append('replicaLabels[]', label));
        }

        // Add store matchers if specified
        if (options.storeMatchers) {
            options.storeMatchers.forEach(matcher => params.append('storeMatch[]', matcher));
        }

        const response = await fetch(`${this.config.queryUrl}/api/v1/query?${params}`);

        if (!response.ok) {
            throw new Error(`Thanos query failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Execute a range query against Thanos Query
     */
    async rangeQuery(options: ThanosQueryOptions): Promise<ThanosQueryResult> {
        const { query, start, end, step = '60s' } = options;

        const params = new URLSearchParams({
            query,
            start: (start || new Date(Date.now() - 3600000)).toISOString(),
            end: (end || new Date()).toISOString(),
            step,
            dedup: String(options.dedup ?? this.config.defaultDedup),
            partial_response: String(options.partialResponse ?? this.config.defaultPartialResponse),
            ...(options.timeout && { timeout: options.timeout }),
            ...(options.maxSourceResolution && { max_source_resolution: options.maxSourceResolution }),
        });

        // Add replica labels if specified
        if (options.replicaLabels) {
            options.replicaLabels.forEach(label => params.append('replicaLabels[]', label));
        }

        // Add store matchers if specified
        if (options.storeMatchers) {
            options.storeMatchers.forEach(matcher => params.append('storeMatch[]', matcher));
        }

        const response = await fetch(`${this.config.queryUrl}/api/v1/query_range?${params}`);

        if (!response.ok) {
            throw new Error(`Thanos range query failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get available stores/endpoints
     */
    async getStores(): Promise<ThanosStore[]> {
        const response = await fetch(`${this.config.queryUrl}/api/v1/stores`);

        if (!response.ok) {
            throw new Error(`Failed to fetch Thanos stores: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data?.stores || [];
    }

    /**
     * Get label names
     */
    async getLabelNames(start?: Date, end?: Date): Promise<string[]> {
        const params = new URLSearchParams();
        if (start) params.set('start', start.toISOString());
        if (end) params.set('end', end.toISOString());

        const response = await fetch(`${this.config.queryUrl}/api/v1/labels?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch label names: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get label values for a specific label
     */
    async getLabelValues(labelName: string, start?: Date, end?: Date): Promise<string[]> {
        const params = new URLSearchParams();
        if (start) params.set('start', start.toISOString());
        if (end) params.set('end', end.toISOString());

        const response = await fetch(`${this.config.queryUrl}/api/v1/label/${labelName}/values?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch label values: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get series matching a selector
     */
    async getSeries(matchers: string[], start?: Date, end?: Date): Promise<Record<string, string>[]> {
        const params = new URLSearchParams();
        matchers.forEach(m => params.append('match[]', m));
        if (start) params.set('start', start.toISOString());
        if (end) params.set('end', end.toISOString());

        const response = await fetch(`${this.config.queryUrl}/api/v1/series?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch series: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Check endpoint health
     */
    async checkHealth(): Promise<{ status: string; stores: number }> {
        try {
            const stores = await this.getStores();
            const healthyStores = stores.filter(s => !s.lastError);

            return {
                status: healthyStores.length === stores.length ? 'healthy' :
                    healthyStores.length > 0 ? 'degraded' : 'unhealthy',
                stores: stores.length,
            };
        } catch {
            return { status: 'unhealthy', stores: 0 };
        }
    }

    /**
     * Get configured regions
     */
    getRegions() {
        return this.config.regions;
    }

    /**
     * Query across specific regions
     */
    async queryByRegion(query: string, regionIds: string[]): Promise<Map<string, ThanosQueryResult>> {
        const results = new Map<string, ThanosQueryResult>();

        // Build store matchers for specific regions
        const storeMatchers = regionIds.map(id => `region="${id}"`);

        const result = await this.instantQuery(query, undefined, {
            storeMatchers,
            dedup: true,
        });

        // Group results by region label
        regionIds.forEach(id => {
            const regionResults = result.data.result.filter(r => r.metric.region === id);
            results.set(id, {
                ...result,
                data: {
                    ...result.data,
                    result: regionResults,
                },
            });
        });

        return results;
    }
}

// Singleton instance
let thanosService: ThanosQueryService | null = null;

export function getThanosService(config?: Partial<ThanosConfig>): ThanosQueryService {
    if (!thanosService || config) {
        thanosService = new ThanosQueryService(config);
    }
    return thanosService;
}

export default ThanosQueryService;
