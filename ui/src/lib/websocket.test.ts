import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWebSocketStore, WSMessage } from './websocket';

describe('WebSocket Store', () => {

    beforeEach(() => {
        // Reset store state before each test
        const store = useWebSocketStore.getState();
        store.setError(null);
        store.setConnected(false);
        store.resetReconnect();
        // Clear subscribers manually since there's no reset action
        store.subscribers.clear();
    });

    it('should initialize with default state', () => {
        const state = useWebSocketStore.getState();
        expect(state.isConnected).toBe(false);
        expect(state.reconnectAttempts).toBe(0);
        expect(state.connectionError).toBe(null);
    });

    it('should update connection state', () => {
        const store = useWebSocketStore.getState();
        store.setConnected(true);
        expect(useWebSocketStore.getState().isConnected).toBe(true);
    });

    it('should handle reconnect attempts', () => {
        const store = useWebSocketStore.getState();
        store.incrementReconnect();
        expect(useWebSocketStore.getState().reconnectAttempts).toBe(1);
        store.resetReconnect();
        expect(useWebSocketStore.getState().reconnectAttempts).toBe(0);
    });

    it('should handle errors', () => {
        const store = useWebSocketStore.getState();
        store.setError('Failed');
        expect(useWebSocketStore.getState().connectionError).toBe('Failed');
    });

    it('should subscribe and notify', () => {
        const store = useWebSocketStore.getState();
        const callback = vi.fn();

        const unsubscribe = store.subscribe('metrics', callback);

        const message: WSMessage = {
            type: 'metrics',
            payload: { value: 10 },
            timestamp: new Date().toISOString()
        };

        store.notifySubscribers(message);
        expect(callback).toHaveBeenCalledWith(message);

        unsubscribe();
        store.notifySubscribers(message);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should only notify correct subscribers', () => {
        const store = useWebSocketStore.getState();
        const metricsCallback = vi.fn();
        const alertCallback = vi.fn();

        store.subscribe('metrics', metricsCallback);
        store.subscribe('alert', alertCallback);

        store.notifySubscribers({
            type: 'metrics',
            payload: {},
            timestamp: ''
        });

        expect(metricsCallback).toHaveBeenCalled();
        expect(alertCallback).not.toHaveBeenCalled();
    });
});
