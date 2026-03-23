"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    Clock,
    ChevronDown,
    ChevronRight,
    Play,
    Pause,
    Download,
    RefreshCw,
    Settings,
    X,
    AlertTriangle,
    AlertCircle,
    Info,
    Bug,
    Terminal,
    Maximize2,
    Copy,
    Check,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataQuery } from '@/lib/hooks/useDataQuery';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    metadata: Record<string, any>;
    traceId?: string;
}

// Generate mock log entries
function generateMockLogs(count: number): LogEntry[] {
    const services = ['api-gateway', 'auth-service', 'user-service', 'payment-service', 'notification-service', 'scheduler'];
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace'];
    const messages = {
        error: [
            'Connection refused to database',
            'Request timeout after 30000ms',
            'Authentication failed for user',
            'Out of memory exception',
            'Failed to parse JSON payload',
        ],
        warn: [
            'Slow query detected (>500ms)',
            'Rate limit approaching threshold',
            'Deprecated API endpoint called',
            'Certificate expires in 7 days',
            'High memory usage detected',
        ],
        info: [
            'Request processed successfully',
            'User login successful',
            'Cache invalidated',
            'Scheduled job completed',
            'Health check passed',
        ],
        debug: [
            'Processing request payload',
            'Database query executed',
            'Cache lookup result: HIT',
            'Validating request parameters',
            'Starting background task',
        ],
        trace: [
            'Entering function handleRequest',
            'HTTP headers received',
            'Middleware chain executing',
            'Response serialization started',
            'Connection pool status checked',
        ],
    };

    const logs: LogEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const level = levels[Math.floor(Math.random() * (i < 10 ? 3 : levels.length))];
        const service = services[Math.floor(Math.random() * services.length)];
        const messageList = messages[level];

        logs.push({
            id: `log-${i}`,
            timestamp: new Date(now - i * 1000 * Math.random() * 60).toISOString(),
            level,
            service,
            message: messageList[Math.floor(Math.random() * messageList.length)],
            metadata: {
                requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
                host: `${service}-${Math.floor(Math.random() * 3) + 1}.prod`,
                duration: level === 'warn' ? Math.floor(Math.random() * 1000) + 500 : Math.floor(Math.random() * 100),
            },
            traceId: Math.random() > 0.7 ? `trace-${Math.random().toString(36).substr(2, 16)}` : undefined,
        });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}


export default function LogsExplorerPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>(['error', 'warn', 'info', 'debug']);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [isLiveTail, setIsLiveTail] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [timeRange, setTimeRange] = useState('1h');
    const logsContainerRef = useRef<HTMLDivElement>(null);

    const { logs: rawLogs, isLoading: isQueryLoading, refresh: executeQuery } = useDataQuery({
        targets: [{
            refId: 'A',
            query: searchQuery || '*',
            type: 'logs',
            limit: 100
        }],
        timeRange: { from: `now-${timeRange}`, to: 'now' },
        refreshInterval: isLiveTail ? 5000 : 0,
        datasourceType: 'elasticsearch',
        enabled: true
    });

    const logs: LogEntry[] = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return generateMockLogs(50);

        return rawLogs.map((l: any) => ({
            id: l.id || String(Math.random()),
            timestamp: l['@timestamp'] || l.timestamp || new Date().toISOString(),
            level: l.level || (l.message?.toLowerCase().includes('error') ? 'error' : 'info'),
            service: l.service || l.app || 'unknown',
            message: l.message || '',
            metadata: l.metadata || l,
            traceId: l.traceId || l.trace_id
        }));
    }, [rawLogs]);

    const services = useMemo(() => {
        return [...new Set(logs.map(log => log.service))];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = !searchQuery ||
                log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase());

            const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(log.level);
            const matchesService = selectedServices.length === 0 || selectedServices.includes(log.service);
            return matchesSearch && matchesLevel && matchesService;
        });
    }, [logs, searchQuery, selectedLevels, selectedServices]);

    const toggleLevel = (level: LogLevel) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    };

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        );
    };

    const toggleExpandLog = (id: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const levelCounts = useMemo(() => ({
        error: logs.filter(l => l.level === 'error').length,
        warn: logs.filter(l => l.level === 'warn').length,
        info: logs.filter(l => l.level === 'info').length,
        debug: logs.filter(l => l.level === 'debug').length,
        trace: logs.filter(l => l.level === 'trace').length,
    }), [logs]);

    const router = useRouter();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/explore')}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ArrowLeft size={18} className="text-muted-foreground" />
                        </button>
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                            <Terminal size={20} className="text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Logs Explorer</h1>
                            <p className="text-sm text-muted-foreground">
                                Search and analyze application logs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsLiveTail(!isLiveTail)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                isLiveTail
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isLiveTail ? <Pause size={14} /> : <Play size={14} />}
                            {isLiveTail ? 'Pause' : 'Live Tail'}
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <Download size={18} className="text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <Settings size={18} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search logs by message, service, or metadata..."
                            className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        />
                    </div>

                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    >
                        <option value="15m">Last 15 minutes</option>
                        <option value="1h">Last 1 hour</option>
                        <option value="6h">Last 6 hours</option>
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                    </select>

                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <RefreshCw size={16} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Level Filters */}
                <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs text-muted-foreground">Levels:</span>
                    {(['error', 'warn', 'info', 'debug', 'trace'] as LogLevel[]).map(level => (
                        <LevelBadge
                            key={level}
                            level={level}
                            count={levelCounts[level]}
                            active={selectedLevels.includes(level)}
                            onClick={() => toggleLevel(level)}
                        />
                    ))}
                    <div className="h-4 w-px bg-border mx-2" />
                    <span className="text-xs text-muted-foreground">Services:</span>
                    {services.slice(0, 4).map(service => (
                        <button
                            key={service}
                            onClick={() => toggleService(service)}
                            className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-colors",
                                selectedServices.includes(service)
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {service}
                        </button>
                    ))}
                    {services.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{services.length - 4} more</span>
                    )}
                </div>
            </div>

            {/* Log Stream */}
            <div ref={logsContainerRef} className="flex-1 overflow-auto">
                <div className="divide-y divide-border">
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Search size={48} className="text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium mb-1">No logs found</h3>
                            <p className="text-sm text-muted-foreground">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    ) : (
                        filteredLogs.map(log => (
                            <LogRow
                                key={log.id}
                                log={log}
                                isExpanded={expandedLogs.has(log.id)}
                                onToggle={() => toggleExpandLog(log.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="shrink-0 border-t border-border bg-card/50 px-6 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {filteredLogs.length} of {logs.length} logs</span>
                {(isLiveTail || isQueryLoading) && (
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live tail active
                    </span>
                )}
            </div>
        </div>
    );
}

// ============== Components ==============

interface LevelBadgeProps {
    level: LogLevel;
    count: number;
    active: boolean;
    onClick: () => void;
}

function LevelBadge({ level, count, active, onClick }: LevelBadgeProps) {
    const config: Record<LogLevel, { icon: React.ReactNode; color: string; activeColor: string }> = {
        error: {
            icon: <AlertCircle size={12} />,
            color: 'text-red-500',
            activeColor: 'bg-red-500/10 text-red-500 border-red-500/30'
        },
        warn: {
            icon: <AlertTriangle size={12} />,
            color: 'text-amber-500',
            activeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30'
        },
        info: {
            icon: <Info size={12} />,
            color: 'text-blue-500',
            activeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/30'
        },
        debug: {
            icon: <Bug size={12} />,
            color: 'text-purple-500',
            activeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/30'
        },
        trace: {
            icon: <Terminal size={12} />,
            color: 'text-gray-500',
            activeColor: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
        },
    };

    const { icon, activeColor } = config[level];

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all border",
                active
                    ? activeColor
                    : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
            )}
        >
            {icon}
            <span className="uppercase">{level}</span>
            <span className="opacity-60">({count})</span>
        </button>
    );
}

interface LogRowProps {
    log: LogEntry;
    isExpanded: boolean;
    onToggle: () => void;
}

function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
    const [copied, setCopied] = useState(false);

    const levelConfig: Record<LogLevel, { icon: React.ReactNode; color: string; bg: string }> = {
        error: { icon: <AlertCircle size={14} />, color: 'text-red-500', bg: 'bg-red-500/10' },
        warn: { icon: <AlertTriangle size={14} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        info: { icon: <Info size={14} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        debug: { icon: <Bug size={14} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        trace: { icon: <Terminal size={14} />, color: 'text-gray-500', bg: 'bg-gray-500/10' },
    };

    const config = levelConfig[log.level];
    const timestamp = new Date(log.timestamp);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group">
            <div
                onClick={onToggle}
                className="flex items-start gap-3 px-6 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
            >
                {/* Expand Icon */}
                <button className="mt-0.5 shrink-0">
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-muted-foreground" />
                    ) : (
                        <ChevronRight size={14} className="text-muted-foreground" />
                    )}
                </button>

                {/* Timestamp */}
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-24">
                    {timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    <span className="opacity-50">.{timestamp.getMilliseconds().toString().padStart(3, '0')}</span>
                </span>

                {/* Level */}
                <span className={cn("shrink-0 w-16", config.color)}>
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium uppercase", config.bg)}>
                        {config.icon}
                        {log.level}
                    </span>
                </span>

                {/* Service */}
                <span className="shrink-0 w-32 text-xs font-medium text-primary truncate">
                    {log.service}
                </span>

                {/* Message */}
                <span className="flex-1 text-sm font-mono truncate">
                    {log.message}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="p-1 hover:bg-muted rounded"
                    >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-muted-foreground" />}
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-6 py-3 bg-muted/30 border-t border-border">
                    <div className="ml-8 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Full Timestamp:</span>
                                <span className="ml-2 font-mono">{log.timestamp}</span>
                            </div>
                            {log.traceId && (
                                <div>
                                    <span className="text-muted-foreground">Trace ID:</span>
                                    <span className="ml-2 font-mono text-primary">{log.traceId}</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Metadata:</span>
                            <pre className="mt-1 p-2 bg-background rounded text-xs font-mono overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
