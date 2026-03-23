// Elasticsearch Data Source

import {
    DataSource,
    DataQueryRequest,
    DataQueryResponse,
    Series,
    parseRelativeTime,
} from "./types";

interface ElasticsearchHit {
    _index: string;
    _id: string;
    _source: Record<string, unknown>;
}

interface ElasticsearchAggBucket {
    key: number | string;
    key_as_string?: string;
    doc_count: number;
    [aggName: string]: unknown;
}

interface ElasticsearchResponse {
    hits: {
        total: { value: number };
        hits: ElasticsearchHit[];
    };
    aggregations?: Record<string, {
        buckets?: ElasticsearchAggBucket[];
        value?: number;
    }>;
}

export class ElasticsearchDataSource implements DataSource {
    id: string;
    type = "elasticsearch";
    name: string;
    url: string;
    index: string;

    constructor(config: { id: string; name: string; url: string; index?: string }) {
        this.id = config.id;
        this.name = config.name;
        this.url = config.url.replace(/\/$/, "");
        this.index = config.index || "*";
    }

    async query(request: DataQueryRequest): Promise<DataQueryResponse> {
        const fromTs = parseRelativeTime(request.range.from);
        const toTs = parseRelativeTime(request.range.to);

        const allSeries: Series[] = [];

        for (const target of request.targets) {
            if (!target.query) continue;

            try {
                if (target.type === "logs") {
                    const query = {
                        size: target.limit || 100,
                        sort: [{ "@timestamp": { order: "desc" } }],
                        query: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            "@timestamp": {
                                                gte: fromTs,
                                                lte: toTs,
                                                format: "epoch_millis",
                                            },
                                        },
                                    },
                                ],
                                filter: target.query !== "*" ? [
                                    {
                                        query_string: {
                                            query: target.query,
                                        },
                                    },
                                ] : [],
                            },
                        },
                    };

                    const response = await fetch(`${this.url}/${this.index}/_search`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(query),
                    });

                    if (!response.ok) throw new Error(`ES Logs query failed: ${response.statusText}`);
                    const result = await response.json();

                    return {
                        data: [],
                        logs: result.hits.hits.map((h: any) => ({
                            id: h._id,
                            ...h._source
                        }))
                    };
                }

                // Build date histogram aggregation (for metrics)
                const interval = this.calculateInterval(fromTs, toTs);

                const query = {
                    size: 0,
                    query: {
                        bool: {
                            must: [
                                {
                                    range: {
                                        "@timestamp": {
                                            gte: fromTs,
                                            lte: toTs,
                                            format: "epoch_millis",
                                        },
                                    },
                                },
                            ],
                            filter: target.query !== "*" ? [
                                {
                                    query_string: {
                                        query: target.query,
                                    },
                                },
                            ] : [],
                        },
                    },
                    aggs: {
                        time_buckets: {
                            date_histogram: {
                                field: "@timestamp",
                                fixed_interval: interval,
                                min_doc_count: 0,
                                extended_bounds: {
                                    min: fromTs,
                                    max: toTs,
                                },
                            },
                            aggs: {
                                count: {
                                    value_count: {
                                        field: "_id",
                                    },
                                },
                            },
                        },
                    },
                };

                const response = await fetch(`${this.url}/${this.index}/_search`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(query),
                });

                if (!response.ok) {
                    throw new Error(`Elasticsearch query failed: ${response.statusText}`);
                }

                const result: ElasticsearchResponse = await response.json();

                // Convert to Series format
                const buckets = result.aggregations?.time_buckets?.buckets || [];
                const data = buckets.map((bucket) => ({
                    timestamp: typeof bucket.key === "number" ? bucket.key : Date.parse(String(bucket.key)),
                    value: bucket.doc_count,
                }));

                allSeries.push({
                    name: target.legendFormat || target.query || "Count",
                    labels: { query: target.query || "" },
                    data,
                });
            } catch (error) {
                console.error(`Elasticsearch query error for ${target.refId}:`, error);
                return {
                    data: [],
                    error: error instanceof Error ? error.message : "Query failed",
                };
            }
        }

        return { data: allSeries };
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${this.url}/_cluster/health`);
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: `Connected to Elasticsearch (${data.cluster_name}, status: ${data.status})`,
                };
            }
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Connection failed",
            };
        }
    }

    async metricFindQuery(
        query: string
    ): Promise<Array<{ text: string; value: string }>> {
        try {
            // Get unique field values
            const fieldMatch = query.match(/^unique\((\w+)\)$/);
            if (fieldMatch) {
                const field = fieldMatch[1];
                const response = await fetch(`${this.url}/${this.index}/_search`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        size: 0,
                        aggs: {
                            unique_values: {
                                terms: { field, size: 100 },
                            },
                        },
                    }),
                });

                const data = await response.json();
                const buckets = data.aggregations?.unique_values?.buckets || [];
                return buckets.map((b: { key: string }) => ({ text: b.key, value: b.key }));
            }

            // Get indices
            if (query === "indices()") {
                const response = await fetch(`${this.url}/_cat/indices?format=json`);
                const indices = await response.json();
                return indices.map((idx: { index: string }) => ({
                    text: idx.index,
                    value: idx.index
                }));
            }

            return [];
        } catch (error) {
            console.error("Metric find query error:", error);
            return [];
        }
    }

    private calculateInterval(from: number, to: number): string {
        const rangeMs = to - from;
        const rangeSeconds = rangeMs / 1000;

        if (rangeSeconds < 3600) return "1m";
        if (rangeSeconds < 86400) return "5m";
        if (rangeSeconds < 604800) return "1h";
        if (rangeSeconds < 2592000) return "6h";
        return "1d";
    }
}
