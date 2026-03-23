// Prometheus Data Source

import {
    DataSource,
    DataQuery,
    DataQueryRequest,
    DataQueryResponse,
    Series,
    parseRelativeTime,
    calculateStep,
} from "./types";

interface PrometheusQueryResult {
    status: "success" | "error";
    data?: {
        resultType: "matrix" | "vector" | "scalar";
        result: Array<{
            metric: Record<string, string>;
            values?: [number, string][];
            value?: [number, string];
        }>;
    };
    error?: string;
    errorType?: string;
}

export class PrometheusDataSource implements DataSource {
    id: string;
    type = "prometheus";
    name: string;
    url: string;

    constructor(config: { id: string; name: string; url: string }) {
        this.id = config.id;
        this.name = config.name;
        this.url = config.url.replace(/\/$/, ""); // Remove trailing slash
    }

    async query(request: DataQueryRequest): Promise<DataQueryResponse> {
        const fromTs = parseRelativeTime(request.range.from);
        const toTs = parseRelativeTime(request.range.to);
        const step = calculateStep(fromTs, toTs, request.maxDataPoints || 1000);

        const allSeries: Series[] = [];

        for (const target of request.targets) {
            if (!target.expr) continue;

            try {
                const params = new URLSearchParams({
                    query: target.expr,
                    start: (fromTs / 1000).toString(),
                    end: (toTs / 1000).toString(),
                    step: step.toString(),
                });

                const response = await fetch(
                    `${this.url}/api/v1/query_range?${params}`,
                    {
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Prometheus query failed: ${response.statusText}`);
                }

                const result: PrometheusQueryResult = await response.json();

                if (result.status !== "success" || !result.data) {
                    throw new Error(result.error || "Unknown Prometheus error");
                }

                // Convert Prometheus result to our Series format
                for (const series of result.data.result) {
                    const name = this.formatLegend(target.legendFormat || "", series.metric);
                    const data = (series.values || []).map(([ts, val]) => ({
                        timestamp: ts * 1000,
                        value: parseFloat(val),
                    }));

                    allSeries.push({
                        name,
                        labels: series.metric,
                        data,
                    });
                }
            } catch (error) {
                console.error(`Prometheus query error for ${target.refId}:`, error);
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
            const response = await fetch(`${this.url}/api/v1/status/buildinfo`);
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: `Connected to Prometheus ${data.data?.version || ""}`,
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
            // Handle label_values() function
            const labelValuesMatch = query.match(/label_values\((\w+)(?:,\s*(\w+))?\)/);
            if (labelValuesMatch) {
                const [, metricOrLabel, labelName] = labelValuesMatch;

                if (labelName) {
                    // label_values(metric, label_name)
                    const response = await fetch(
                        `${this.url}/api/v1/label/${labelName}/values`
                    );
                    const data = await response.json();
                    return (data.data || []).map((v: string) => ({ text: v, value: v }));
                } else {
                    // label_values(label_name) - all values for this label
                    const response = await fetch(
                        `${this.url}/api/v1/label/${metricOrLabel}/values`
                    );
                    const data = await response.json();
                    return (data.data || []).map((v: string) => ({ text: v, value: v }));
                }
            }

            // Handle metrics() function
            if (query === "metrics()" || query === "label_names()") {
                const response = await fetch(`${this.url}/api/v1/label/__name__/values`);
                const data = await response.json();
                return (data.data || []).map((v: string) => ({ text: v, value: v }));
            }

            return [];
        } catch (error) {
            console.error("Metric find query error:", error);
            return [];
        }
    }

    private formatLegend(
        format: string,
        labels: Record<string, string>
    ): string {
        if (!format) {
            // Default: metric name or labels
            if (labels.__name__) return labels.__name__;
            return Object.entries(labels)
                .map(([k, v]) => `${k}="${v}"`)
                .join(", ");
        }

        // Replace {{label_name}} with actual values
        return format.replace(/\{\{(\w+)\}\}/g, (match, label) => {
            return labels[label] || match;
        });
    }
}
