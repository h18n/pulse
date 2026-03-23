import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ElasticsearchDataSource } from './elasticsearch';

describe('ElasticsearchDataSource', () => {
    let ds: ElasticsearchDataSource;

    beforeEach(() => {
        ds = new ElasticsearchDataSource({
            id: 'es1',
            name: 'Logs DB',
            url: 'http://elastic:9200/',
            index: 'logs-*'
        });
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should initialize correctly and strip trailing slashes', () => {
        expect(ds.id).toBe('es1');
        expect(ds.url).toBe('http://elastic:9200'); // slash stripped
        expect(ds.index).toBe('logs-*');
    });

    it('should query logs successfully', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                hits: {
                    total: { value: 1 },
                    hits: [
                        { _id: '1', _source: { message: 'hello' } }
                    ]
                }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', type: 'logs', query: 'error' }],
            intervalMs: 1000,
            maxDataPoints: 100
        });

        expect(fetch).toHaveBeenCalled();
        expect(res.logs).toBeDefined();
        if (res.logs) {
            expect(res.logs.length).toBe(1);
            expect(res.logs[0].id).toBe('1');
            expect(res.logs[0].message).toBe('hello');
        }
    });

    it('should handle ES logs query returning not ok', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Bad Request' });

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', type: 'logs', query: 'error' }],
            intervalMs: 1000,
            maxDataPoints: 100
        });

        expect(res.data.length).toBe(0);
        expect(res.error).toBe('ES Logs query failed: Bad Request');
    });

    it('should query metrics successfully', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                hits: { total: { value: 2 }, hits: [] },
                aggregations: {
                    time_buckets: {
                        buckets: [
                            { key: 1000, doc_count: 5 },
                            { key: 2000, doc_count: 10 }
                        ]
                    }
                }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', type: 'metrics', query: 'error', legendFormat: 'Errors' }],
            intervalMs: 1000,
            maxDataPoints: 100
        });

        expect(fetch).toHaveBeenCalled();
        expect(res.data.length).toBe(1);
        expect(res.data[0].name).toBe('Errors');
        expect(res.data[0].data[0].value).toBe(5);
        expect(res.data[0].data[1].value).toBe(10);
    });

    it('should handle ES metrics query failure', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Bad Request' });

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', type: 'metrics', query: 'error' }],
            intervalMs: 1000,
            maxDataPoints: 100
        });

        expect(res.data.length).toBe(0);
        expect(res.error).toBe('Elasticsearch query failed: Bad Request');
    });

    it('should skip querying if target has no query string', async () => {
        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', type: 'metrics', query: '' }],
            intervalMs: 1000,
            maxDataPoints: 100
        });

        expect(res.data.length).toBe(0);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should query unique field values for metricFindQuery', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                aggregations: {
                    unique_values: { buckets: [{ key: 'val1' }, { key: 'val2' }] }
                }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.metricFindQuery('unique(host)');
        expect(res.length).toBe(2);
        expect(res[0].text).toBe('val1');
    });

    it('should query indices for metricFindQuery', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ([{ index: 'idx1' }, { index: 'idx2' }])
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.metricFindQuery('indices()');
        expect(res.length).toBe(2);
        expect(res[0].text).toBe('idx1');
    });

    it('should return empty for unknown metricFindQuery', async () => {
        const res = await ds.metricFindQuery('unknown()');
        expect(res.length).toBe(0);
    });

    it('should test connection successfully', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ cluster_name: 'test-cluster', status: 'green' })
        });

        const res = await ds.testConnection();
        expect(res.success).toBe(true);
        expect(res.message).toContain('Connected to Elasticsearch (test-cluster, status: green)');
    });

    it('should test connection returning failed ok', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        const res = await ds.testConnection();
        expect(res.success).toBe(false);
        expect(res.message).toBe('HTTP 401: Unauthorized');
    });

    it('should handle test connection throw', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        const res = await ds.testConnection();
        expect(res.success).toBe(false);
        expect(res.message).toBe('Network error');
    });

    it('should handle metricFindQuery throw gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('ES error'));
        const res = await ds.metricFindQuery('unique(host)');
        expect(res.length).toBe(0);
    });

    it('should handle different time ranges in calculateInterval', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ hits: { total: { value: 0 }, hits: [] }, aggregations: { time_buckets: { buckets: [] } } })
        });

        const testRange = async (from: string, to: string) => {
            await ds.query({
                range: { from, to },
                targets: [{ refId: 'A', type: 'metrics', query: '*' }],
                intervalMs: 1000,
                maxDataPoints: 100
            });
            const lastCall = (global.fetch as any).mock.calls.at(-1);
            return JSON.parse(lastCall[1].body).aggs.time_buckets.date_histogram.fixed_interval;
        };

        expect(await testRange('now-30m', 'now')).toBe('1m');
        expect(await testRange('now-12h', 'now')).toBe('5m');
        expect(await testRange('now-3d', 'now')).toBe('1h');
        expect(await testRange('now-14d', 'now')).toBe('6h');
        expect(await testRange('now-60d', 'now')).toBe('1d');
    });

    it('should query metrics with query string "*" correctly', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ hits: { total: { value: 0 }, hits: [] }, aggregations: { time_buckets: { buckets: [] } } })
        });

        await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', type: 'metrics', query: '*' }],
            intervalMs: 1000,
            maxDataPoints: 100
        });

        const lastCall = (global.fetch as any).mock.calls.at(-1);
        const body = JSON.parse(lastCall[1].body);
        expect(body.query.bool.filter.length).toBe(0);
    });
});
