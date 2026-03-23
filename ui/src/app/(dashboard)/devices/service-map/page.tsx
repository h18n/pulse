"use client";

import React, { useState, useMemo } from 'react';
import {
    ArrowLeft,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RefreshCw,
    Filter,
    Search,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronRight,
    Activity,
    Clock,
    TrendingUp,
    ArrowRight,
    Layers
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ServiceStatus = 'healthy' | 'degraded' | 'critical';

interface ServiceNode {
    id: string;
    name: string;
    type: 'frontend' | 'backend' | 'database' | 'cache' | 'queue' | 'external';
    status: ServiceStatus;
    metrics: {
        requestRate: number;
        errorRate: number;
        p99Latency: number;
    };
    instances: number;
}

interface ServiceEdge {
    source: string;
    target: string;
    requestRate: number;
    errorRate: number;
    latency: number;
}

const MOCK_SERVICES: ServiceNode[] = [
    { id: 'frontend', name: 'Web Frontend', type: 'frontend', status: 'healthy', metrics: { requestRate: 1250, errorRate: 0.1, p99Latency: 45 }, instances: 3 },
    { id: 'api-gateway', name: 'API Gateway', type: 'backend', status: 'healthy', metrics: { requestRate: 4500, errorRate: 0.3, p99Latency: 12 }, instances: 4 },
    { id: 'user-service', name: 'User Service', type: 'backend', status: 'healthy', metrics: { requestRate: 850, errorRate: 0.2, p99Latency: 35 }, instances: 2 },
    { id: 'auth-service', name: 'Auth Service', type: 'backend', status: 'healthy', metrics: { requestRate: 620, errorRate: 0.1, p99Latency: 28 }, instances: 2 },
    { id: 'checkout-service', name: 'Checkout Service', type: 'backend', status: 'critical', metrics: { requestRate: 340, errorRate: 4.5, p99Latency: 890 }, instances: 3 },
    { id: 'inventory-service', name: 'Inventory Service', type: 'backend', status: 'degraded', metrics: { requestRate: 520, errorRate: 1.2, p99Latency: 180 }, instances: 2 },
    { id: 'payment-gateway', name: 'Payment Gateway', type: 'external', status: 'degraded', metrics: { requestRate: 180, errorRate: 2.1, p99Latency: 450 }, instances: 1 },
    { id: 'notification-service', name: 'Notification Service', type: 'backend', status: 'healthy', metrics: { requestRate: 420, errorRate: 0.3, p99Latency: 55 }, instances: 2 },
    { id: 'postgres-primary', name: 'PostgreSQL Primary', type: 'database', status: 'healthy', metrics: { requestRate: 2800, errorRate: 0.05, p99Latency: 8 }, instances: 1 },
    { id: 'postgres-replica', name: 'PostgreSQL Replica', type: 'database', status: 'healthy', metrics: { requestRate: 1200, errorRate: 0.02, p99Latency: 6 }, instances: 1 },
    { id: 'redis-cache', name: 'Redis Cache', type: 'cache', status: 'healthy', metrics: { requestRate: 8500, errorRate: 0.01, p99Latency: 2 }, instances: 3 },
    { id: 'rabbitmq', name: 'RabbitMQ', type: 'queue', status: 'healthy', metrics: { requestRate: 1500, errorRate: 0.1, p99Latency: 15 }, instances: 3 },
];

const MOCK_EDGES: ServiceEdge[] = [
    { source: 'frontend', target: 'api-gateway', requestRate: 1250, errorRate: 0.1, latency: 12 },
    { source: 'api-gateway', target: 'user-service', requestRate: 850, errorRate: 0.2, latency: 35 },
    { source: 'api-gateway', target: 'auth-service', requestRate: 620, errorRate: 0.1, latency: 28 },
    { source: 'api-gateway', target: 'checkout-service', requestRate: 340, errorRate: 4.5, latency: 890 },
    { source: 'api-gateway', target: 'inventory-service', requestRate: 520, errorRate: 1.2, latency: 180 },
    { source: 'checkout-service', target: 'payment-gateway', requestRate: 180, errorRate: 2.1, latency: 450 },
    { source: 'checkout-service', target: 'inventory-service', requestRate: 340, errorRate: 0.5, latency: 45 },
    { source: 'checkout-service', target: 'notification-service', requestRate: 150, errorRate: 0.2, latency: 30 },
    { source: 'user-service', target: 'postgres-primary', requestRate: 800, errorRate: 0.05, latency: 8 },
    { source: 'auth-service', target: 'postgres-primary', requestRate: 600, errorRate: 0.03, latency: 6 },
    { source: 'checkout-service', target: 'postgres-primary', requestRate: 400, errorRate: 0.08, latency: 10 },
    { source: 'inventory-service', target: 'postgres-replica', requestRate: 1200, errorRate: 0.02, latency: 6 },
    { source: 'user-service', target: 'redis-cache', requestRate: 2500, errorRate: 0.01, latency: 2 },
    { source: 'auth-service', target: 'redis-cache', requestRate: 3000, errorRate: 0.01, latency: 1 },
    { source: 'notification-service', target: 'rabbitmq', requestRate: 420, errorRate: 0.1, latency: 15 },
];

export default function ServiceMapPage() {
    const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [showOnlyErrors, setShowOnlyErrors] = useState(false);

    const filteredServices = useMemo(() => {
        if (!showOnlyErrors) return MOCK_SERVICES;
        return MOCK_SERVICES.filter(s => s.status !== 'healthy');
    }, [showOnlyErrors]);

    const stats = useMemo(() => ({
        total: MOCK_SERVICES.length,
        healthy: MOCK_SERVICES.filter(s => s.status === 'healthy').length,
        degraded: MOCK_SERVICES.filter(s => s.status === 'degraded').length,
        critical: MOCK_SERVICES.filter(s => s.status === 'critical').length,
    }), []);

    // Group services by type for layout
    const servicesByType = useMemo(() => {
        const groups = {
            frontend: filteredServices.filter(s => s.type === 'frontend'),
            backend: filteredServices.filter(s => s.type === 'backend'),
            database: filteredServices.filter(s => s.type === 'database'),
            cache: filteredServices.filter(s => s.type === 'cache'),
            queue: filteredServices.filter(s => s.type === 'queue'),
            external: filteredServices.filter(s => s.type === 'external'),
        };
        return groups;
    }, [filteredServices]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/devices"
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <Layers size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Service Map</h1>
                                <p className="text-sm text-muted-foreground">
                                    Visualize service dependencies and health
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                showOnlyErrors ? "bg-red-500/10 text-red-500" : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            <AlertTriangle size={14} />
                            Show Issues Only
                        </button>
                        <div className="flex items-center bg-muted rounded-lg border border-border">
                            <button
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                                className="p-2 hover:bg-background rounded-l-lg transition-colors"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <span className="px-3 text-sm">{Math.round(zoom * 100)}%</span>
                            <button
                                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                                className="p-2 hover:bg-background rounded-r-lg transition-colors"
                            >
                                <ZoomIn size={14} />
                            </button>
                        </div>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <RefreshCw size={18} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="font-medium">{stats.healthy}</span>
                        <span className="text-muted-foreground">Healthy</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="font-medium">{stats.degraded}</span>
                        <span className="text-muted-foreground">Degraded</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <XCircle size={14} className="text-red-500" />
                        <span className="font-medium">{stats.critical}</span>
                        <span className="text-muted-foreground">Critical</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Service Map Visualization */}
                <div className="flex-1 overflow-auto p-6 bg-background/50">
                    <div
                        className="min-h-full"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                    >
                        {/* Service Layers */}
                        <div className="space-y-8">
                            {/* Frontend Layer */}
                            <ServiceLayer
                                title="Frontend"
                                services={servicesByType.frontend}
                                selectedId={selectedService?.id}
                                onSelect={setSelectedService}
                            />

                            {/* API Layer */}
                            <ServiceLayer
                                title="API Gateway"
                                services={filteredServices.filter(s => s.id === 'api-gateway')}
                                selectedId={selectedService?.id}
                                onSelect={setSelectedService}
                            />

                            {/* Backend Services */}
                            <ServiceLayer
                                title="Backend Services"
                                services={servicesByType.backend.filter(s => s.id !== 'api-gateway')}
                                selectedId={selectedService?.id}
                                onSelect={setSelectedService}
                            />

                            {/* Data Layer */}
                            <ServiceLayer
                                title="Data Layer"
                                services={[...servicesByType.database, ...servicesByType.cache, ...servicesByType.queue]}
                                selectedId={selectedService?.id}
                                onSelect={setSelectedService}
                            />

                            {/* External */}
                            {servicesByType.external.length > 0 && (
                                <ServiceLayer
                                    title="External Services"
                                    services={servicesByType.external}
                                    selectedId={selectedService?.id}
                                    onSelect={setSelectedService}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Detail Sidebar */}
                {selectedService && (
                    <ServiceDetailSidebar
                        service={selectedService}
                        edges={MOCK_EDGES.filter(e => e.source === selectedService.id || e.target === selectedService.id)}
                        allServices={MOCK_SERVICES}
                        onClose={() => setSelectedService(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ============== Components ==============

interface ServiceLayerProps {
    title: string;
    services: ServiceNode[];
    selectedId?: string;
    onSelect: (service: ServiceNode) => void;
}

function ServiceLayer({ title, services, selectedId, onSelect }: ServiceLayerProps) {
    if (services.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                    {title}
                </span>
                <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                {services.map(service => (
                    <ServiceNodeCard
                        key={service.id}
                        service={service}
                        isSelected={selectedId === service.id}
                        onClick={() => onSelect(service)}
                    />
                ))}
            </div>
        </div>
    );
}

interface ServiceNodeCardProps {
    service: ServiceNode;
    isSelected: boolean;
    onClick: () => void;
}

function ServiceNodeCard({ service, isSelected, onClick }: ServiceNodeCardProps) {
    const statusConfig: Record<ServiceStatus, { color: string; bg: string; ring: string; pulse?: boolean }> = {
        healthy: { color: 'border-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
        degraded: { color: 'border-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-500/30' },
        critical: { color: 'border-red-500', bg: 'bg-red-500', ring: 'ring-red-500/30', pulse: true },
    };

    const config = statusConfig[service.status];

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative p-4 bg-card border-2 rounded-xl cursor-pointer transition-all min-w-[180px]",
                config.color,
                isSelected && `shadow-lg ${config.ring} ring-4`,
                config.pulse && "animate-pulse"
            )}
        >
            {/* Status indicator */}
            <div className={cn("absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-background", config.bg)} />

            <h3 className="font-medium text-sm mb-2 truncate">{service.name}</h3>

            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                    <p className="font-medium">{service.metrics.requestRate}</p>
                    <p className="text-muted-foreground">req/s</p>
                </div>
                <div className="text-center">
                    <p className={cn(
                        "font-medium",
                        service.metrics.errorRate > 1 ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {service.metrics.errorRate}%
                    </p>
                    <p className="text-muted-foreground">errors</p>
                </div>
                <div className="text-center">
                    <p className={cn(
                        "font-medium",
                        service.metrics.p99Latency > 200 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                        {service.metrics.p99Latency}ms
                    </p>
                    <p className="text-muted-foreground">p99</p>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>{service.instances} instance{service.instances > 1 ? 's' : ''}</span>
                <span className="capitalize">{service.type}</span>
            </div>
        </div>
    );
}

interface ServiceDetailSidebarProps {
    service: ServiceNode;
    edges: ServiceEdge[];
    allServices: ServiceNode[];
    onClose: () => void;
}

function ServiceDetailSidebar({ service, edges, allServices, onClose }: ServiceDetailSidebarProps) {
    const inbound = edges.filter(e => e.target === service.id);
    const outbound = edges.filter(e => e.source === service.id);

    const getServiceName = (id: string) => allServices.find(s => s.id === id)?.name || id;

    const statusConfig = {
        healthy: { label: 'Healthy', color: 'text-emerald-500 bg-emerald-500/10' },
        degraded: { label: 'Degraded', color: 'text-amber-500 bg-amber-500/10' },
        critical: { label: 'Critical', color: 'text-red-500 bg-red-500/10' },
    };

    return (
        <div className="w-[400px] border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                    <h2 className="font-bold">{service.name}</h2>
                    <p className="text-xs text-muted-foreground capitalize">{service.type}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                    <XCircle size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        statusConfig[service.status].color
                    )}>
                        {statusConfig[service.status].label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {service.instances} instance{service.instances > 1 ? 's' : ''} running
                    </span>
                </div>

                {/* Key Metrics */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Key Metrics</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                            <Activity size={16} className="mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{service.metrics.requestRate}</p>
                            <p className="text-xs text-muted-foreground">req/s</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                            <AlertTriangle size={16} className={cn(
                                "mx-auto mb-1",
                                service.metrics.errorRate > 1 ? "text-red-500" : "text-muted-foreground"
                            )} />
                            <p className={cn(
                                "text-lg font-bold",
                                service.metrics.errorRate > 1 && "text-red-500"
                            )}>
                                {service.metrics.errorRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">error rate</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                            <Clock size={16} className={cn(
                                "mx-auto mb-1",
                                service.metrics.p99Latency > 200 ? "text-amber-500" : "text-muted-foreground"
                            )} />
                            <p className={cn(
                                "text-lg font-bold",
                                service.metrics.p99Latency > 200 && "text-amber-500"
                            )}>
                                {service.metrics.p99Latency}ms
                            </p>
                            <p className="text-xs text-muted-foreground">p99 latency</p>
                        </div>
                    </div>
                </div>

                {/* Dependencies */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Inbound ({inbound.length})</h4>
                    {inbound.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No inbound dependencies</p>
                    ) : (
                        <div className="space-y-2">
                            {inbound.map(edge => (
                                <DependencyRow
                                    key={edge.source}
                                    name={getServiceName(edge.source)}
                                    requestRate={edge.requestRate}
                                    errorRate={edge.errorRate}
                                    latency={edge.latency}
                                    isInbound
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-medium mb-3">Outbound ({outbound.length})</h4>
                    {outbound.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No outbound dependencies</p>
                    ) : (
                        <div className="space-y-2">
                            {outbound.map(edge => (
                                <DependencyRow
                                    key={edge.target}
                                    name={getServiceName(edge.target)}
                                    requestRate={edge.requestRate}
                                    errorRate={edge.errorRate}
                                    latency={edge.latency}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-2">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                    View Metrics
                </button>
                <button className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">
                    View Logs
                </button>
            </div>
        </div>
    );
}

interface DependencyRowProps {
    name: string;
    requestRate: number;
    errorRate: number;
    latency: number;
    isInbound?: boolean;
}

function DependencyRow({ name, requestRate, errorRate, latency, isInbound }: DependencyRowProps) {
    return (
        <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
            {isInbound ? (
                <ArrowRight size={14} className="text-blue-500" />
            ) : (
                <ArrowRight size={14} className="text-emerald-500" />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">
                    {requestRate} req/s • {errorRate}% err • {latency}ms
                </p>
            </div>
            <span className={cn(
                "w-2 h-2 rounded-full",
                errorRate > 1 ? "bg-red-500" : latency > 200 ? "bg-amber-500" : "bg-emerald-500"
            )} />
        </div>
    );
}
