import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrometheusDataSource } from './prometheus';

describe('PrometheusDataSource', () => {
    let ds: PrometheusDataSource;

    beforeEach(() => {
        ds = new PrometheusDataSource({
            id: 'prom',
            name: 'Prometheus',
            url: 'http://prom.local:9090/'
        });
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should strip trailing slashes in url', () => {
        expect(ds.url).toBe('http://prom.local:9090');
    });

    it('should query metrics successfully and format legend', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                status: 'success',
                data: {
                    resultType: 'matrix',
                    result: [
                        {
                            metric: { __name__: 'up', instance: 'localhost' },
                            values: [[1000, '1'], [2000, '0']]
                        }
                    ]
                }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', expr: 'up', legendFormat: '{{instance}} is {{__name__}}' }]
        });

        expect(fetch).toHaveBeenCalled();
        expect(res.data.length).toBe(1);
        expect(res.data[0].name).toBe('localhost is up');
        expect(res.data[0].data.length).toBe(2);
        expect(res.data[0].data[0].value).toBe(1);
    });

    it('should default formatLegend if no format supplied', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                status: 'success',
                data: {
                    resultType: 'matrix',
                    result: [
                        { metric: { __name__: 'up' }, values: [[1000, '1']] },
                        { metric: { k: 'v' }, values: [[1000, '2']] }
                    ]
                }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', expr: 'up' }]
        });

        expect(res.data.length).toBe(2);
        expect(res.data[0].name).toBe('up');
        expect(res.data[1].name).toBe('k="v"');
    });

    it('should skip query if target has no expr', async () => {
        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', expr: '' }]
        });
        expect(res.data.length).toBe(0);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle failed query with not ok', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Bad Request' });

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', expr: 'up' }]
        });

        expect(res.data.length).toBe(0);
        expect(res.error).toBe('Prometheus query failed: Bad Request');
    });

    it('should handle api error response payload', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ status: 'error', error: 'Syntax Error' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.query({
            range: { from: 'now-1h', to: 'now' },
            targets: [{ refId: 'A', expr: 'up' }]
        });

        expect(res.data.length).toBe(0);
        expect(res.error).toBe('Syntax Error');
    });

    it('should handle metricFindQuery label_names', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: ['job', 'instance'] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.metricFindQuery('label_names()');
        expect(res.length).toBe(2);
        expect(res[0].text).toBe('job');
    });

    it('should handle metricFindQuery label_values with one arg', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: ['prometheus'] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.metricFindQuery('label_values(job)');
        expect(res.length).toBe(1);
    });

    it('should handle metricFindQuery label_values with two args', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: ['localhost'] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.metricFindQuery('label_values(up, instance)');
        expect(res.length).toBe(1);
    });

    it('should return empty for unknown metricFindQuery', async () => {
        const res = await ds.metricFindQuery('unknown()');
        expect(res.length).toBe(0);
    });

    it('should handle metricFindQuery failure gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));
        const res = await ds.metricFindQuery('label_names()');
        expect(res.length).toBe(0);
    });

    it('should test connection successfully', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: { version: '2.45.0' } })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await ds.testConnection();
        expect(res.success).toBe(true);
        expect(res.message).toBe('Connected to Prometheus 2.45.0');
    });

    it('should handle test connection failure not ok', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' });

        const res = await ds.testConnection();
        expect(res.success).toBe(false);
        expect(res.message).toBe('HTTP 503: Service Unavailable');
    });

    it('should handle test connection network exception', async () => {
        (global.fetch as any).mockRejectedValue(new Error('timeout'));

        const res = await ds.testConnection();
        expect(res.success).toBe(false);
        expect(res.message).toBe('timeout');
    });
});
