'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { create } from 'zustand';

// WebSocket message types
export type WSMessageType =
    | 'metrics'
    | 'alert'
    | 'dashboard_update'
    | 'panel_data'
    | 'connection_status'
    | 'heartbeat';

export interface WSMessage<T = unknown> {
    type: WSMessageType;
    payload: T;
    timestamp: string;
    requestId?: string;
}

export interface MetricData {
    metricName: string;
    value: number;
    labels: Record<string, string>;
    timestamp: number;
}

export interface AlertNotification {
    id: string;
    name: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
}

export interface PanelDataUpdate {
    panelId: string;
    dashboardId: string;
    data: MetricData[];
}

// WebSocket connection state
interface WebSocketState {
    isConnected: boolean;
    lastMessage: WSMessage | null;
    connectionError: string | null;
    reconnectAttempts: number;
    subscribers: Map<WSMessageType, Set<(message: WSMessage) => void>>;

    // Actions
    setConnected: (connected: boolean) => void;
    setLastMessage: (message: WSMessage) => void;
    setError: (error: string | null) => void;
    incrementReconnect: () => void;
    resetReconnect: () => void;
    subscribe: (type: WSMessageType, callback: (message: WSMessage) => void) => () => void;
    notifySubscribers: (message: WSMessage) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    isConnected: false,
    lastMessage: null,
    connectionError: null,
    reconnectAttempts: 0,
    subscribers: new Map(),

    setConnected: (connected) => set({ isConnected: connected }),
    setLastMessage: (message) => set({ lastMessage: message }),
    setError: (error) => set({ connectionError: error }),
    incrementReconnect: () => set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
    resetReconnect: () => set({ reconnectAttempts: 0 }),

    subscribe: (type, callback) => {
        const { subscribers } = get();
        if (!subscribers.has(type)) {
            subscribers.set(type, new Set());
        }
        subscribers.get(type)!.add(callback);

        // Return unsubscribe function
        return () => {
            subscribers.get(type)?.delete(callback);
        };
    },

    notifySubscribers: (message) => {
        const { subscribers } = get();
        const typeSubscribers = subscribers.get(message.type);
        if (typeSubscribers) {
            typeSubscribers.forEach((callback) => callback(message));
        }
    },
}));

// WebSocket configuration
interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
}

const DEFAULT_CONFIG: WebSocketConfig = {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
};

// WebSocket hook
export function useWebSocket(config: Partial<WebSocketConfig> = {}) {
    const wsRef = useRef<WebSocket | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        isConnected,
        connectionError,
        reconnectAttempts,
        setConnected,
        setLastMessage,
        setError,
        incrementReconnect,
        resetReconnect,
        notifySubscribers,
    } = useWebSocketStore();

    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    // Send message
    const send = useCallback((message: WSMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            return true;
        }
        console.warn('[WebSocket] Cannot send - not connected');
        return false;
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    // Heartbeat to keep connection alive
    const startHeartbeat = useCallback(() => {
        heartbeatRef.current = setInterval(() => {
            send({
                type: 'heartbeat',
                payload: null,
                timestamp: new Date().toISOString(),
            });
        }, fullConfig.heartbeatInterval);
    }, [fullConfig.heartbeatInterval, send]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        stopHeartbeat();

        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }
        setConnected(false);
    }, [stopHeartbeat, setConnected]);

    // Connect to WebSocket
    const connect = useCallback(function doConnect() {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            wsRef.current = new WebSocket(fullConfig.url);

            wsRef.current.onopen = () => {
                console.log('[WebSocket] Connected');
                setConnected(true);
                setError(null);
                resetReconnect();
                startHeartbeat();
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message: WSMessage = JSON.parse(event.data);
                    setLastMessage(message);
                    notifySubscribers(message);
                } catch (err) {
                    console.error('[WebSocket] Failed to parse message:', err);
                }
            };

            wsRef.current.onerror = (event) => {
                console.error('[WebSocket] Error:', event);
                setError('WebSocket connection error');
            };

            wsRef.current.onclose = (event) => {
                console.log('[WebSocket] Disconnected:', event.code, event.reason);
                setConnected(false);
                stopHeartbeat();

                // Attempt reconnection
                if (reconnectAttempts < (fullConfig.maxReconnectAttempts || 10)) {
                    incrementReconnect();
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log(`[WebSocket] Reconnecting... (attempt ${reconnectAttempts + 1})`);
                        doConnect();
                    }, fullConfig.reconnectInterval);
                } else {
                    setError('Max reconnection attempts reached');
                }
            };
        } catch (err) {
            console.error('[WebSocket] Failed to connect:', err);
            setError('Failed to establish WebSocket connection');
        }
    }, [
        fullConfig.url,
        fullConfig.reconnectInterval,
        fullConfig.maxReconnectAttempts,
        reconnectAttempts,
        incrementReconnect,
        notifySubscribers,
        resetReconnect,
        setConnected,
        setError,
        setLastMessage,
        startHeartbeat,
        stopHeartbeat,
    ]);

    // Subscribe to a specific message type
    const subscribe = useCallback((type: WSMessageType, callback: (message: WSMessage) => void) => {
        return useWebSocketStore.getState().subscribe(type, callback);
    }, []);

    // Request panel data subscription
    const subscribeToPanelData = useCallback((dashboardId: string, panelIds: string[]) => {
        send({
            type: 'panel_data',
            payload: { action: 'subscribe', dashboardId, panelIds },
            timestamp: new Date().toISOString(),
        });
    }, [send]);

    // Unsubscribe from panel data
    const unsubscribeFromPanelData = useCallback((dashboardId: string) => {
        send({
            type: 'panel_data',
            payload: { action: 'unsubscribe', dashboardId },
            timestamp: new Date().toISOString(),
        });
    }, [send]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        connectionError,
        reconnectAttempts,
        connect,
        disconnect,
        send,
        subscribe,
        subscribeToPanelData,
        unsubscribeFromPanelData,
    };
}

// Hook for subscribing to real-time metric updates
export function useRealtimeMetrics(panelId: string, dashboardId: string) {
    const [data, setData] = useState<MetricData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { subscribe, subscribeToPanelData, unsubscribeFromPanelData, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        // Subscribe to panel data updates
        subscribeToPanelData(dashboardId, [panelId]);

        // Listen for updates
        const unsubscribe = subscribe('panel_data', (message) => {
            const update = message.payload as PanelDataUpdate;
            if (update.panelId === panelId) {
                setData(update.data);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
            unsubscribeFromPanelData(dashboardId);
        };
    }, [panelId, dashboardId, isConnected, subscribe, subscribeToPanelData, unsubscribeFromPanelData]);

    return { data, isLoading, isConnected };
}

// Hook for real-time alerts
export function useRealtimeAlerts() {
    const [alerts, setAlerts] = useState<AlertNotification[]>([]);
    const { subscribe, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        const unsubscribe = subscribe('alert', (message) => {
            const alert = message.payload as AlertNotification;
            setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50
        });

        return unsubscribe;
    }, [isConnected, subscribe]);

    return { alerts, isConnected };
}
