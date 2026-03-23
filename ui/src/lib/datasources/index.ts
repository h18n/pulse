// Data Source Registry

import { DataSource } from "./types";
import { PrometheusDataSource } from "./prometheus";
import { ElasticsearchDataSource } from "./elasticsearch";

// Global data source registry
const dataSources = new Map<string, DataSource>();

// Initialize default data sources from environment
export function initializeDataSources() {
    // Prometheus
    const prometheusUrl = process.env.NEXT_PUBLIC_PROMETHEUS_URL || "http://localhost:9090";
    registerDataSource(
        new PrometheusDataSource({
            id: "prometheus-default",
            name: "Prometheus",
            url: prometheusUrl,
        })
    );

    // Elasticsearch
    const elasticsearchUrl = process.env.NEXT_PUBLIC_ELASTICSEARCH_URL || "http://localhost:9200";
    registerDataSource(
        new ElasticsearchDataSource({
            id: "elasticsearch-default",
            name: "Elasticsearch",
            url: elasticsearchUrl,
            index: "logs-*",
        })
    );
}

export function registerDataSource(ds: DataSource) {
    dataSources.set(ds.id, ds);
}

export function getDataSource(id: string): DataSource | undefined {
    return dataSources.get(id);
}

export function getDataSourceByType(type: string): DataSource | undefined {
    for (const ds of dataSources.values()) {
        if (ds.type === type) return ds;
    }
    return undefined;
}

export function getAllDataSources(): DataSource[] {
    return Array.from(dataSources.values());
}

export function getDefaultDataSource(): DataSource | undefined {
    return dataSources.get("prometheus-default") || dataSources.values().next().value;
}

// Initialize on module load
initializeDataSources();

// Re-export types
export * from "./types";
export { PrometheusDataSource } from "./prometheus";
export { ElasticsearchDataSource } from "./elasticsearch";
