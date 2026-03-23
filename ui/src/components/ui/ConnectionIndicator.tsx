'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocket, useWebSocketStore } from '@/lib/websocket';

interface ConnectionIndicatorProps {
    showLabel?: boolean;
    className?: string;
}

export function ConnectionIndicator({ showLabel = true, className }: ConnectionIndicatorProps) {
    const { isConnected, connectionError, reconnectAttempts } = useWebSocketStore();
    const { connect } = useWebSocket();
    const [isReconnecting, setIsReconnecting] = useState(false);

    const handleReconnect = () => {
        setIsReconnecting(true);
        connect();
        setTimeout(() => setIsReconnecting(false), 2000);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {isConnected ? (
                <>
                    <div className="relative">
                        <Wifi size={16} className="text-emerald-500" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    {showLabel && (
                        <span className="text-xs text-emerald-500">Live</span>
                    )}
                </>
            ) : connectionError ? (
                <>
                    <AlertCircle size={16} className="text-destructive" />
                    {showLabel && (
                        <span className="text-xs text-destructive">Disconnected</span>
                    )}
                    <button
                        onClick={handleReconnect}
                        disabled={isReconnecting}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Reconnect"
                    >
                        <RefreshCw size={14} className={cn(
                            "text-muted-foreground",
                            isReconnecting && "animate-spin"
                        )} />
                    </button>
                </>
            ) : (
                <>
                    <WifiOff size={16} className="text-muted-foreground" />
                    {showLabel && (
                        <span className="text-xs text-muted-foreground">
                            {reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})...` : 'Offline'}
                        </span>
                    )}
                </>
            )}
        </div>
    );
}

// Live data refresh indicator with countdown
interface LiveRefreshIndicatorProps {
    refreshInterval: number; // in seconds
    onRefresh: () => void;
    isRefreshing?: boolean;
    className?: string;
}

export function LiveRefreshIndicator({
    refreshInterval,
    onRefresh,
    isRefreshing = false,
    className,
}: LiveRefreshIndicatorProps) {
    const [countdown, setCountdown] = useState(refreshInterval);
    const { isConnected } = useWebSocketStore();

    useEffect(() => {
        if (!isConnected || refreshInterval <= 0) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    onRefresh();
                    return refreshInterval;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [refreshInterval, onRefresh, isConnected]);

    // Reset countdown when refresh interval changes
    useEffect(() => {
        setCountdown(refreshInterval);
    }, [refreshInterval]);

    if (!isConnected || refreshInterval <= 0) {
        return null;
    }

    return (
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
            <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
            <span>Refresh in {countdown}s</span>
        </div>
    );
}

// Real-time data stream indicator
interface DataStreamIndicatorProps {
    isStreaming: boolean;
    dataRate?: number; // events per second
    className?: string;
}

export function DataStreamIndicator({
    isStreaming,
    dataRate,
    className,
}: DataStreamIndicatorProps) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-full text-xs",
            isStreaming ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground",
            className
        )}>
            <div className={cn(
                "w-2 h-2 rounded-full",
                isStreaming ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
            )} />
            <span>
                {isStreaming
                    ? dataRate
                        ? `${dataRate.toFixed(1)} events/s`
                        : 'Streaming'
                    : 'Paused'
                }
            </span>
        </div>
    );
}

export default ConnectionIndicator;
