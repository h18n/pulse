import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MQTTSensorService, MQTTBrokerConfig, getMQTTService } from './mqtt';

describe('MQTTSensorService', () => {
    let service: MQTTSensorService;

    beforeEach(() => {
        service = new MQTTSensorService();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should add, get and remove broker', () => {
        const broker: MQTTBrokerConfig = {
            id: 'broker-1',
            name: 'Primary Broker',
            host: 'test.mosquitto.org',
            port: 1883,
            protocol: 'mqtt',
            topics: []
        };

        service.addBroker(broker);
        const status = service.getStatus('broker-1');
        expect(status).toBeDefined();
        expect(status?.status).toBe('disconnected');

        expect(service.getAllStatuses().length).toBe(1);

        service.removeBroker('broker-1');
        expect(service.getStatus('broker-1')).toBeUndefined();
    });

    it('should simulate establishing connection and updating status', async () => {
        const broker: MQTTBrokerConfig = {
            id: 'broker-2',
            name: 'Secondary',
            host: 'localhost',
            port: 1883,
            protocol: 'mqtt',
            topics: []
        };
        service.addBroker(broker);

        const connectPromise = service.connect('broker-2');
        expect(service.getStatus('broker-2')?.status).toBe('connecting');

        // Wait for connection delay
        await vi.advanceTimersByTimeAsync(1000);
        await connectPromise;

        expect(service.getStatus('broker-2')?.status).toBe('connected');
        expect(service.getStatus('broker-2')?.lastConnected).toBeDefined();

        service.disconnect('broker-2');
        expect(service.getStatus('broker-2')?.status).toBe('disconnected');
    });

    it('should throw error when connecting to non-existent broker', async () => {
        await expect(service.connect('non-existent')).rejects.toThrow('Broker non-existent not found');
    });

    it('should generate simulated sensor data and devices', async () => {
        const broker: MQTTBrokerConfig = {
            id: 'broker-3',
            name: 'IoT Hub',
            host: 'localhost',
            port: 1883,
            protocol: 'mqtt',
            topics: []
        };
        service.addBroker(broker);

        const connectPromise = service.connect('broker-3');
        await vi.advanceTimersByTimeAsync(1000);
        await connectPromise;

        // Advance timers to trigger the setInterval simulation (5000ms)
        const mockMessageHandler = vi.fn();
        service.on('message', mockMessageHandler);

        await vi.advanceTimersByTimeAsync(5000);

        expect(mockMessageHandler).toHaveBeenCalled();
        const devices = service.getDevices();
        expect(devices.length).toBeGreaterThan(0);

        const firstDevice = devices[0];
        expect(firstDevice.metrics.length).toBeGreaterThan(0);
        expect(firstDevice.status).toBe('online');
    });

    it('should use single instance via getMQTTService', () => {
        const instance1 = getMQTTService();
        const instance2 = getMQTTService();
        expect(instance1).toBe(instance2);
    });
});
