import { describe, it, expect, beforeEach } from 'vitest';
import { registerDataSource, getDataSource, getDataSourceByType, getAllDataSources, getDefaultDataSource, initializeDataSources } from './index';
import { PrometheusDataSource } from './prometheus';

describe('DataSource Registry', () => {

    beforeEach(() => {
        // Since it's a singleton pattern with globals, we might be stateful.
        // Let's just register a fresh one.
        const ds = new PrometheusDataSource({
            id: 'test-ds',
            name: 'Test',
            url: 'http://test'
        });
        registerDataSource(ds);
    });

    it('should register and get data source', () => {
        const ds = getDataSource('test-ds');
        expect(ds).toBeDefined();
        expect(ds?.name).toBe('Test');
    });

    it('should get data source by type', () => {
        const ds = getDataSourceByType('prometheus');
        expect(ds).toBeDefined();
    });

    it('should get all data sources', () => {
        const dss = getAllDataSources();
        expect(dss.length).toBeGreaterThan(0);
    });

    it('should get default data source', () => {
        const ds = getDefaultDataSource();
        expect(ds).toBeDefined();
    });

    it('should initialize from environment', () => {
        // This was already called on module load, but we can call it again.
        initializeDataSources();
        expect(getDataSource('prometheus-default')).toBeDefined();
    });
});
