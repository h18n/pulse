'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useWebSocket, useWebSocketStore, WSMessage, WSMessageType } from '@/lib/websocket';

interface WebSocketContextValue {
    isConnected: boolean;
    connectionError: string | null;
    send: (message: WSMessage) => boolean;
    subscribe: (type: WSMessageType, callback: (message: WSMessage) => void) => () => void;
    subscribeToPanelData: (dashboardId: string, panelIds: string[]) => void;
    unsubscribeFromPanelData: (dashboardId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
    children: React.ReactNode;
    autoConnect?: boolean;
}

export function WebSocketProvider({ children, autoConnect = true }: WebSocketProviderProps) {
    const ws = useWebSocket();

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            ws.connect();
        }

        return () => {
            ws.disconnect();
        };
    }, [autoConnect]);

    const value = useMemo<WebSocketContextValue>(() => ({
        isConnected: ws.isConnected,
        connectionError: ws.connectionError,
        send: ws.send,
        subscribe: ws.subscribe,
        subscribeToPanelData: ws.subscribeToPanelData,
        unsubscribeFromPanelData: ws.unsubscribeFromPanelData,
    }), [ws.isConnected, ws.connectionError, ws.send, ws.subscribe, ws.subscribeToPanelData, ws.unsubscribeFromPanelData]);

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within WebSocketProvider');
    }
    return context;
}

export default WebSocketProvider;
