import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThanosQueryService, getThanosService } from './thanos';

describe('ThanosQueryService', () => {
    let service: ThanosQueryService;

    beforeEach(() => {
        service = new ThanosQueryService();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should run instantQuery successfully', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                status: 'success',
                data: { resultType: 'vector', result: [] }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await service.instantQuery('up', new Date('2023-01-01T00:00:00Z'), {
            timeout: '10s',
            replicaLabels: ['replica'],
            storeMatchers: ['store']
        });

        expect(fetch).toHaveBeenCalled();
        expect(res.status).toBe('success');
    });

    it('should handle instantQuery failure', async () => {
        const mockResponse = { ok: false, statusText: 'Bad Request' };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await expect(service.instantQuery('up')).rejects.toThrow('Thanos query failed: Bad Request');
    });

    it('should run rangeQuery successfully', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                status: 'success',
                data: { resultType: 'matrix', result: [] }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const res = await service.rangeQuery({
            query: 'up',
            start: new Date('2023-01-01T00:00:00Z'),
            end: new Date('2023-01-01T01:00:00Z'),
            step: '15s',
            replicaLabels: ['replica'],
            storeMatchers: ['store']
        });

        expect(fetch).toHaveBeenCalled();
        expect(res.status).toBe('success');
    });

    it('should handle rangeQuery failure', async () => {
        const mockResponse = { ok: false, statusText: 'Internal Server Error' };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await expect(service.rangeQuery({ query: 'up' })).rejects.toThrow('Thanos range query failed: Internal Server Error');
    });

    it('should fetch stores', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                data: { stores: [{ name: 'store1' }] }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const stores = await service.getStores();
        expect(stores.length).toBe(1);
        expect(stores[0].name).toBe('store1');
    });

    it('should handle getStores failure', async () => {
        const mockResponse = { ok: false, statusText: 'Error' };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await expect(service.getStores()).rejects.toThrow('Failed to fetch Thanos stores: Error');
    });

    it('should get label names', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: ['job', 'instance'] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const labels = await service.getLabelNames(new Date(), new Date());
        expect(labels).toEqual(['job', 'instance']);
    });

    it('should handle getLabelNames failure', async () => {
        const mockResponse = { ok: false, statusText: 'Error' };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await expect(service.getLabelNames()).rejects.toThrow('Failed to fetch label names: Error');
    });

    it('should get label values', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: ['prometheus', 'node'] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const values = await service.getLabelValues('job', new Date(), new Date());
        expect(values).toEqual(['prometheus', 'node']);
    });

    it('should handle getLabelValues failure', async () => {
        const mockResponse = { ok: false, statusText: 'Error' };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await expect(service.getLabelValues('job')).rejects.toThrow('Failed to fetch label values: Error');
    });

    it('should get series', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: [{ __name__: 'up' }] })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const series = await service.getSeries(['up'], new Date(), new Date());
        expect(series.length).toBe(1);
    });

    it('should handle getSeries failure', async () => {
        const mockResponse = { ok: false, statusText: 'Error' };
        (global.fetch as any).mockResolvedValue(mockResponse);

        await expect(service.getSeries(['up'])).rejects.toThrow('Failed to fetch series: Error');
    });

    it('should check health and report healthy', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                data: { stores: [{ name: 'store1' }] }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const health = await service.checkHealth();
        expect(health.status).toBe('healthy');
        expect(health.stores).toBe(1);
    });

    it('should check health and report degraded or unhealthy', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                data: { stores: [{ name: 'store1', lastError: 'timeout' }, { name: 'store2' }] }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const health = await service.checkHealth();
        expect(health.status).toBe('degraded');

        const mockFetchFail = vi.fn().mockRejectedValue(new Error('Network error'));
        global.fetch = mockFetchFail;
        const healthFail = await service.checkHealth();
        expect(healthFail.status).toBe('unhealthy');
    });

    it('should get regions', () => {
        const regions = service.getRegions();
        expect(regions.length).toBeGreaterThan(0);
    });

    it('should query by region', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                status: 'success',
                data: { resultType: 'vector', result: [{ metric: { region: 'us-east-1' } }] }
            })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const results = await service.queryByRegion('up', ['us-east-1', 'eu-west-1']);

        expect(results.get('us-east-1')?.data.result.length).toBe(1);
        expect(results.get('eu-west-1')?.data.result.length).toBe(0); // None had eu-west-1
    });

    it('should use single instance via getThanosService', () => {
        const instance1 = getThanosService();
        const instance2 = getThanosService();
        expect(instance1).toBe(instance2);

        const instance3 = getThanosService({ defaultDedup: false });
        expect(instance3).toBeInstanceOf(ThanosQueryService);
    });
});
