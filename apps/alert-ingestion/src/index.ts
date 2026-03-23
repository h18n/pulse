import Fastify, { type FastifyInstance } from 'fastify';
import { Client } from '@elastic/elasticsearch';
import pino from 'pino';

// @ts-ignore - Fixing type mismatch in fastify config
const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true }
        }
    }
});

const logger = fastify.log;

const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

const INDEX_ALERTS = 'pulse-alerts';

interface Alert {
    fingerprint: string;
    status: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    startsAt: string;
}

// Initialize Elasticsearch Index
async function initES() {
    try {
        const exists = await esClient.indices.exists({ index: INDEX_ALERTS });
        if (!exists) {
            await esClient.indices.create({
                index: INDEX_ALERTS,
                mappings: {
                    properties: {
                        fingerprint: { type: 'keyword' },
                        status: { type: 'keyword' },
                        severity: { type: 'keyword' },
                        summary: { type: 'text' },
                        labels: { type: 'object' },
                        annotations: { type: 'object' },
                        startsAt: { type: 'date' },
                        updatedAt: { type: 'date' },
                        endsAt: { type: 'date' },
                        eventCount: { type: 'integer' }
                    }
                }
            });
            logger.info('Elasticsearch index created');
        }
    } catch (err: any) {
        logger.error(`ES initialization error: ${err.message}`);
    }
}

// Ingest Prometheus Alert
fastify.post('/webhooks/prometheus', async (request, reply) => {
    const payload = request.body as { alerts: Alert[] };
    const alerts = payload.alerts || [];

    if (alerts.length === 0) return { status: 'ok' };

    const operations = alerts.flatMap(alert => {
        const { fingerprint, status } = alert;
        const now = new Date().toISOString();
        const endsAt = status === 'resolved' ? now : null;

        return [
            { update: { _index: INDEX_ALERTS, _id: fingerprint } },
            {
                script: {
                    source: `ctx._source.status = params.status; ctx._source.updatedAt = params.now; ctx._source.eventCount += 1; if (params.endsAt != null) { ctx._source.endsAt = params.endsAt; }`,
                    params: { status, now, endsAt }
                },
                upsert: {
                    fingerprint,
                    status,
                    severity: alert.labels['severity'] || 'warning',
                    summary: alert.annotations['summary'] || alert.annotations['description'],
                    labels: alert.labels,
                    annotations: alert.annotations,
                    startsAt: alert.startsAt,
                    updatedAt: now,
                    eventCount: 1
                }
            }
        ];
    });

    try {
        const bulkResponse = await esClient.bulk({ refresh: true, body: operations });
        if (bulkResponse.errors) {
            fastify.log.error('Bulk ingest contained document errors');
        } else {
            fastify.log.info(`Bulk ingested ${alerts.length} alerts successfully`);
        }
    } catch (err: any) {
        fastify.log.error(`Failed to bulk ingest alerts: ${err.message}`);
    }

    return { status: 'ok' };
});

// Get Trace by ID (Waterfall View)
fastify.get('/api/traces/:traceId', async (request, reply) => {
    const { traceId } = request.params as { traceId: string };
    try {
        const searchResponse = await esClient.search({
            index: 'traces*',
            ignore_unavailable: true,
            size: 1000,
            query: {
                match: { traceId }
            },
            sort: [
                { '@timestamp': { order: 'asc', unmapped_type: 'date' } }
            ]
        });
        
        // Return hits formatted for the UI
        return {
            traceId,
            spans: searchResponse.hits.hits.map((hit: any) => hit._source)
        };
    } catch (err: any) {
        fastify.log.error(`Failed to fetch trace ${traceId}: ${err.message}`);
        reply.status(500).send({ error: 'Failed to fetch trace data' });
    }
});

// Search Recent Traces
fastify.get('/api/traces', async (request, reply) => {
    const { service, limit = 50 } = request.query as any;
    
    const must: any[] = [];
    
    if (service) {
        must.push({ match: { 'resource.attributes.service.name': service } });
    }
    
    try {
        // Simple search against Elasticsearch for documents matching trace criteria
        const searchResponse = await esClient.search({
            index: 'traces*',
            ignore_unavailable: true,
            size: limit,
            query: must.length > 0 ? { bool: { must } } : { match_all: {} },
            sort: [
                { '@timestamp': { order: 'desc', unmapped_type: 'date' } }
            ]
        });
        
        return {
            traces: searchResponse.hits.hits.map((hit: any) => hit._source),
            total: searchResponse.hits.total
        };
    } catch (err: any) {
        fastify.log.error(`Failed to search traces: ${err.message}`);
        reply.status(500).send({ error: 'Failed to search traces' });
    }
});

const start = async () => {
    try {
        await initES();
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        logger.info('Alert Ingestion Service running on port 3001');
    } catch (err: any) {
        logger.error(err.message);
        process.exit(1);
    }
};

start();
