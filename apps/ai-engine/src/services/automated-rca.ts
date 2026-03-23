/**
 * Automated Root Cause Analysis (ARCA) Service
 * 
 * This service provides enterprise-grade automated RCA for alerts.
 * It runs asynchronously when new critical/warning alerts are ingested,
 * correlates with relevant context, and generates AI-powered analysis.
 * 
 * @module services/automated-rca
 */

import { Client } from '@elastic/elasticsearch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pino } from 'pino';

const logger = pino({

    transport: { target: 'pino-pretty', options: { colorize: true } }
});

// ============== Types ==============

export interface AlertDocument {
    fingerprint: string;
    status: string;
    severity: string;
    summary: string;
    labels: Record<string, string>;
    annotations?: Record<string, string>;
    startsAt: string;
    updatedAt: string;
    eventCount: number;
    rcaSummary?: RCASummary;
    rcaStatus?: 'pending' | 'completed' | 'failed';
    rcaGeneratedAt?: string;
}

export interface RCASummary {
    rootCause: string;
    contributingFactors: string[];
    suggestedActions: string[];
    impactScore: number;
    confidence: number;
    correlatedAlerts: string[];
    analysisVersion: string;
}

export interface RCAJobPayload {
    alertFingerprint: string;
    alertId: string;
    severity: string;
    priority: 'high' | 'normal' | 'low';
    retryCount?: number;
}

export interface PrometheusMetricContext {
    metricName: string;
    labels: Record<string, string>;
    values: Array<{ timestamp: number; value: number }>;
}

// ============== Configuration ==============

const CONFIG = {
    INDEX_ALERTS: 'pulse-alerts',
    RCA_ANALYSIS_VERSION: '1.0.0',
    MAX_CORRELATED_ALERTS: 15,
    MAX_LOG_ENTRIES: 50,
    METRIC_LOOKBACK_MINUTES: 30,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
};

// ============== Automated RCA Service ==============

export class AutomatedRCAService {
    private esClient: Client;
    private genAI: GoogleGenerativeAI;
    private model: any;
    private prometheusUrl: string;

    constructor(
        esClient: Client,
        geminiApiKey: string,
        prometheusUrl: string = 'http://localhost:9090'
    ) {
        this.esClient = esClient;
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        this.prometheusUrl = prometheusUrl;
    }

    /**
     * Initialize Elasticsearch index
     */
    async initIndex() {
        try {
            const exists = await this.esClient.indices.exists({ index: CONFIG.INDEX_ALERTS });
            if (!exists) {
                await this.esClient.indices.create({
                    index: CONFIG.INDEX_ALERTS,
                    mappings: {
                        properties: {
                            fingerprint: { type: 'keyword' },
                            status: { type: 'keyword' },
                            severity: { type: 'keyword' },
                            startsAt: { type: 'date' },
                            updatedAt: { type: 'date' },
                            rcaStatus: { type: 'keyword' }
                        }
                    }
                });
                logger.info(`[ARCA] Created index: ${CONFIG.INDEX_ALERTS}`);
            }
        } catch (err: any) {
            logger.warn(`[ARCA] Failed to init index: ${err.message}`);
        }
    }

    /**
     * Process an RCA job for a given alert
     */
    async processRCAJob(job: RCAJobPayload): Promise<RCASummary | null> {
        const startTime = Date.now();
        logger.info(`[ARCA] Starting analysis for alert: ${job.alertFingerprint}`);

        try {
            // 1. Fetch the target alert
            const alert = await this.fetchAlert(job.alertFingerprint);
            if (!alert) {
                logger.warn(`[ARCA] Alert not found: ${job.alertFingerprint}`);
                return null;
            }

            // 2. Gather context
            const context = await this.gatherAnalysisContext(alert);

            // 3. Generate RCA via LLM
            const rcaSummary = await this.generateRCA(alert, context);

            // 4. Update alert document with RCA
            await this.updateAlertWithRCA(job.alertId, rcaSummary);

            const duration = Date.now() - startTime;
            logger.info(`[ARCA] Analysis completed for ${job.alertFingerprint} in ${duration}ms`);

            return rcaSummary;
        } catch (err: any) {
            logger.error(`[ARCA] Failed to process job: ${err.message}`);

            // Mark alert as RCA failed
            await this.markRCAFailed(job.alertId, err.message);

            throw err;
        }
    }

    /**
     * Fetch alert document from Elasticsearch
     */
    private async fetchAlert(fingerprint: string): Promise<AlertDocument | null> {
        const response = await this.esClient.search({
            index: CONFIG.INDEX_ALERTS,
            query: { term: { fingerprint } },
            size: 1
        });

        if (response.hits.hits.length === 0) {
            return null;
        }

        return response.hits.hits[0]._source as AlertDocument;
    }

    /**
     * Gather all relevant context for RCA analysis
     */
    private async gatherAnalysisContext(alert: AlertDocument): Promise<{
        correlatedAlerts: AlertDocument[];
        metrics: PrometheusMetricContext[];
        logs: any[];
    }> {
        const [correlatedAlerts, metrics, logs] = await Promise.all([
            this.fetchCorrelatedAlerts(alert),
            this.fetchRelatedMetrics(alert),
            this.fetchRelatedLogs(alert)
        ]);

        return { correlatedAlerts, metrics, logs };
    }

    /**
     * Fetch alerts that may be correlated (same host, service, or time window)
     */
    private async fetchCorrelatedAlerts(alert: AlertDocument): Promise<AlertDocument[]> {
        const alertTime = new Date(alert.startsAt).getTime();
        const windowStart = new Date(alertTime - 30 * 60 * 1000).toISOString();
        const windowEnd = new Date(alertTime + 15 * 60 * 1000).toISOString();

        const mustClauses: any[] = [
            { range: { startsAt: { gte: windowStart, lte: windowEnd } } },
            { bool: { must_not: { term: { fingerprint: alert.fingerprint } } } }
        ];

        // Add host/instance correlation if available
        if (alert.labels['instance']) {
            mustClauses.push({
                bool: {
                    should: [
                        { term: { 'labels.instance': alert.labels['instance'] } },
                        { term: { 'labels.job': alert.labels['job'] || '' } }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        const response = await this.esClient.search({
            index: CONFIG.INDEX_ALERTS,
            query: { bool: { must: mustClauses } },
            sort: [{ startsAt: 'desc' }],
            size: CONFIG.MAX_CORRELATED_ALERTS
        });

        return response.hits.hits.map((hit: any) => hit._source as AlertDocument);
    }

    /**
     * Fetch related metrics from Prometheus
     */
    private async fetchRelatedMetrics(alert: AlertDocument): Promise<PrometheusMetricContext[]> {
        const metrics: PrometheusMetricContext[] = [];

        // Extract metric name from alert if available
        const alertName = alert.labels['alertname'] || '';
        const instance = alert.labels['instance'] || '';

        if (!instance) return metrics;

        // Common metrics to fetch for context
        const metricQueries = [
            `node_load1{instance="${instance}"}`,
            `node_cpu_seconds_total{instance="${instance}",mode="idle"}`,
            `node_memory_MemAvailable_bytes{instance="${instance}"}`,
            `up{instance="${instance}"}`
        ];

        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - (CONFIG.METRIC_LOOKBACK_MINUTES * 60);

        for (const query of metricQueries) {
            try {
                const response = await fetch(
                    `${this.prometheusUrl}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${startTime}&end=${endTime}&step=60`
                );

                if (!response.ok) continue;

                const data = await response.json();
                if (data.data?.result?.length > 0) {
                    const result = data.data.result[0];
                    metrics.push({
                        metricName: result.metric.__name__ || query,
                        labels: result.metric,
                        values: result.values.map((v: any) => ({
                            timestamp: v[0],
                            value: parseFloat(v[1])
                        }))
                    });
                }
            } catch (err) {
                // Silently skip unavailable metrics
            }
        }

        return metrics;
    }

    /**
     * Fetch related logs from Elasticsearch (if log index exists)
     */
    private async fetchRelatedLogs(alert: AlertDocument): Promise<any[]> {
        try {
            const instance = alert.labels['instance'] || '';
            const job = alert.labels['job'] || '';

            const response = await this.esClient.search({
                index: 'pulse-logs-*',
                query: {
                    bool: {
                        must: [
                            { range: { '@timestamp': { gte: 'now-30m' } } },
                            { terms: { level: ['error', 'warn', 'fatal'] } }
                        ],
                        should: [
                            { match: { host: instance.split(':')[0] } },
                            { match: { service: job } }
                        ],
                        minimum_should_match: 1
                    }
                },
                sort: [{ '@timestamp': 'desc' }],
                size: CONFIG.MAX_LOG_ENTRIES
            });

            return response.hits.hits.map((hit: any) => hit._source);
        } catch {
            // Log index may not exist
            return [];
        }
    }

    /**
     * Generate RCA using Gemini LLM
     */
    private async generateRCA(
        alert: AlertDocument,
        context: { correlatedAlerts: AlertDocument[]; metrics: PrometheusMetricContext[]; logs: any[] }
    ): Promise<RCASummary> {
        const prompt = this.buildRCAPrompt(alert, context);

        const result = await this.model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse RCA response from LLM');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            rootCause: parsed.rootCause || 'Unable to determine root cause',
            contributingFactors: parsed.contributingFactors || [],
            suggestedActions: parsed.suggestedActions || parsed.remediation || [],
            impactScore: parsed.impactScore || 5,
            confidence: parsed.confidence || 0.5,
            correlatedAlerts: context.correlatedAlerts.slice(0, 5).map(a => a.fingerprint),
            analysisVersion: CONFIG.RCA_ANALYSIS_VERSION
        };
    }

    /**
     * Build the RCA analysis prompt
     */
    private buildRCAPrompt(
        alert: AlertDocument,
        context: { correlatedAlerts: AlertDocument[]; metrics: PrometheusMetricContext[]; logs: any[] }
    ): string {
        const correlatedSummary = context.correlatedAlerts
            .slice(0, 10)
            .map(a => `- [${a.severity.toUpperCase()}] ${a.summary} (${a.labels['instance'] || 'unknown'})`)
            .join('\n');

        const metricsSummary = context.metrics
            .map(m => {
                const latest = m.values[m.values.length - 1];
                const oldest = m.values[0];
                const trend = latest && oldest ? ((latest.value - oldest.value) / oldest.value * 100).toFixed(1) : 'N/A';
                return `- ${m.metricName}: current=${latest?.value?.toFixed(2) || 'N/A'}, trend=${trend}%`;
            })
            .join('\n');

        const logsSummary = context.logs
            .slice(0, 10)
            .map(l => `- [${l.level}] ${l.message || l.msg || JSON.stringify(l).slice(0, 100)}`)
            .join('\n');

        return `You are an expert Site Reliability Engineer performing automated root cause analysis.

## Primary Alert
- **Summary**: ${alert.summary}
- **Severity**: ${alert.severity}
- **Status**: ${alert.status}
- **Labels**: ${JSON.stringify(alert.labels)}
- **Started**: ${alert.startsAt}
- **Event Count**: ${alert.eventCount}

## Correlated Alerts (Last 30 Minutes)
${correlatedSummary || 'No correlated alerts found.'}

## System Metrics Context
${metricsSummary || 'No metric data available.'}

## Recent Error Logs
${logsSummary || 'No relevant logs found.'}

## Task
Analyze this alert and provide a root cause analysis. Be specific and actionable.

Respond ONLY with valid JSON in this exact format:
{
  "rootCause": "A 1-3 sentence explanation of the most likely root cause",
  "contributingFactors": ["factor1", "factor2", "factor3"],
  "suggestedActions": ["action1", "action2", "action3"],
  "impactScore": 7,
  "confidence": 0.85
}

Rules:
- impactScore is 1-10 (10 = critical business impact)
- confidence is 0-1 (1 = highly confident)
- Keep explanations concise but specific
- Include concrete metrics or patterns observed`;
    }

    /**
     * Update the alert document with RCA results
     */
    private async updateAlertWithRCA(alertId: string, rcaSummary: RCASummary): Promise<void> {
        await this.esClient.update({
            index: CONFIG.INDEX_ALERTS,
            id: alertId,
            doc: {
                rcaSummary,
                rcaStatus: 'completed',
                rcaGeneratedAt: new Date().toISOString()
            }
        });
    }

    /**
     * Mark an alert's RCA as failed
     */
    private async markRCAFailed(alertId: string, error: string): Promise<void> {
        try {
            await this.esClient.update({
                index: CONFIG.INDEX_ALERTS,
                id: alertId,
                doc: {
                    rcaStatus: 'failed',
                    rcaError: error,
                    rcaGeneratedAt: new Date().toISOString()
                }
            });
        } catch {
            // Best effort
        }
    }

    /**
     * Check if an alert should trigger ARCA
     */
    static shouldTriggerARCA(severity: string, status: string): boolean {
        const validSeverities = ['critical', 'warning', 'error'];
        return status === 'firing' && validSeverities.includes(severity.toLowerCase());
    }
}

export default AutomatedRCAService;
