"use client";

import React, { useState, useMemo } from 'react';
import {
    Server,
    Cpu,
    HardDrive,
    MemoryStick,
    Wifi,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Search,
    Filter,
    LayoutGrid,
    List,
    RefreshCw,
    ChevronRight,
    Activity,
    Clock,
    Thermometer,
    Zap,
    Network,
    Container,
    Database,
    Globe,
    Settings,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DeviceStatus = 'healthy' | 'warning' | 'critical' | 'offline';
type DeviceType = 'server' | 'container' | 'database' | 'loadbalancer' | 'storage';

interface Device {
    id: string;
    name: string;
    type: DeviceType;
    status: DeviceStatus;
    ip: string;
    region: string;
    environment: string;
    metrics: {
        cpu: number;
        memory: number;
        disk: number;
        network: { in: number; out: number };
    };
    uptime: string;
    lastSeen: string;
    tags: string[];
    alertCount: number;
}

// Fallback mock devices in case API fails
const FALLBACK_DEVICES: Device[] = [
    {
        id: 'srv-001',
        name: 'prod-api-01',
        type: 'server',
        status: 'healthy',
        ip: '10.0.1.101',
        region: 'us-east-1',
        environment: 'production',
        metrics: { cpu: 42, memory: 68, disk: 55, network: { in: 150, out: 80 } },
        uptime: '45d 12h',
        lastSeen: new Date().toISOString(),
        tags: ['api', 'primary'],
        alertCount: 0,
    },
];

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<DeviceType | 'all'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    React.useEffect(() => {
        const fetchDevices = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/devices');
                if (!response.ok) throw new Error('API failed');
                const data = await response.json();
                setDevices(data);
            } catch (error) {
                console.error('Failed to fetch devices:', error);
                setDevices(FALLBACK_DEVICES);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDevices();
    }, []);

    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            const matchesSearch =
                device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                device.ip.includes(searchQuery) ||
                device.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
            const matchesType = typeFilter === 'all' || device.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [devices, searchQuery, statusFilter, typeFilter]);

    const stats = useMemo(() => ({
        total: devices.length,
        healthy: devices.filter(d => d.status === 'healthy').length,
        warning: devices.filter(d => d.status === 'warning').length,
        critical: devices.filter(d => d.status === 'critical').length,
        offline: devices.filter(d => d.status === 'offline').length,
    }), [devices]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Server size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Infrastructure</h1>
                            <p className="text-sm text-muted-foreground">
                                Monitor servers, containers, and services
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <RefreshCw size={18} className="text-muted-foreground" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                            <Network size={16} />
                            Service Map
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                    <StatusBadge
                        icon={<CheckCircle2 size={14} />}
                        label="Healthy"
                        count={stats.healthy}
                        color="text-emerald-500 bg-emerald-500/10"
                        active={statusFilter === 'healthy'}
                        onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
                    />
                    <StatusBadge
                        icon={<AlertTriangle size={14} />}
                        label="Warning"
                        count={stats.warning}
                        color="text-amber-500 bg-amber-500/10"
                        active={statusFilter === 'warning'}
                        onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
                    />
                    <StatusBadge
                        icon={<XCircle size={14} />}
                        label="Critical"
                        count={stats.critical}
                        color="text-red-500 bg-red-500/10"
                        active={statusFilter === 'critical'}
                        onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
                    />
                    <StatusBadge
                        icon={<Wifi size={14} />}
                        label="Offline"
                        count={stats.offline}
                        color="text-gray-500 bg-gray-500/10"
                        active={statusFilter === 'offline'}
                        onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="shrink-0 px-6 py-3 border-b border-border flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, IP, or tag..."
                        className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    />
                </div>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as DeviceType | 'all')}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                >
                    <option value="all">All Types</option>
                    <option value="server">Servers</option>
                    <option value="container">Containers</option>
                    <option value="database">Databases</option>
                    <option value="loadbalancer">Load Balancers</option>
                    <option value="storage">Storage</option>
                </select>

                <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            viewMode === 'grid' ? "bg-background shadow-sm" : "hover:bg-muted/80"
                        )}
                    >
                        <LayoutGrid size={14} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-muted/80"
                        )}
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto p-6">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredDevices.map(device => (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    isSelected={selectedDevice?.id === device.id}
                                    onClick={() => setSelectedDevice(device)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDevices.map(device => (
                                <DeviceRow
                                    key={device.id}
                                    device={device}
                                    isSelected={selectedDevice?.id === device.id}
                                    onClick={() => setSelectedDevice(device)}
                                />
                            ))}
                        </div>
                    )}

                    {filteredDevices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Server size={48} className="text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium mb-1">No devices found</h3>
                            <p className="text-sm text-muted-foreground">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    )}
                </div>

                {/* Detail Sidebar */}
                {selectedDevice && (
                    <DeviceDetailSidebar
                        device={selectedDevice}
                        onClose={() => setSelectedDevice(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ============== Components ==============

interface StatusBadgeProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    color: string;
    active?: boolean;
    onClick: () => void;
}

function StatusBadge({ icon, label, count, color, active, onClick }: StatusBadgeProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                color,
                active && "ring-2 ring-current ring-offset-2 ring-offset-background"
            )}
        >
            {icon}
            <span className="font-medium">{count}</span>
            <span className="text-muted-foreground">{label}</span>
        </button>
    );
}

const TYPE_ICONS: Record<DeviceType, React.ReactNode> = {
    server: <Server size={18} />,
    container: <Container size={18} />,
    database: <Database size={18} />,
    loadbalancer: <Globe size={18} />,
    storage: <HardDrive size={18} />,
};

const STATUS_COLORS: Record<DeviceStatus, string> = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    offline: 'bg-gray-500',
};

interface DeviceCardProps {
    device: Device;
    isSelected: boolean;
    onClick: () => void;
}

function DeviceCard({ device, isSelected, onClick }: DeviceCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-4 bg-card border rounded-xl cursor-pointer transition-all hover:shadow-lg",
                isSelected ? "border-primary shadow-primary/10" : "border-border hover:border-primary/30"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {TYPE_ICONS[device.type]}
                    </div>
                    <div>
                        <h3 className="font-medium text-sm truncate max-w-[120px]">{device.name}</h3>
                        <p className="text-xs text-muted-foreground">{device.ip}</p>
                    </div>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full", STATUS_COLORS[device.status])} />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <MetricBar label="CPU" value={device.metrics.cpu} />
                <MetricBar label="MEM" value={device.metrics.memory} />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{device.region}</span>
                <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {device.uptime}
                </span>
            </div>

            {device.alertCount > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {device.alertCount} active alert{device.alertCount > 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

interface DeviceRowProps {
    device: Device;
    isSelected: boolean;
    onClick: () => void;
}

function DeviceRow({ device, isSelected, onClick }: DeviceRowProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 p-4 bg-card border rounded-lg cursor-pointer transition-all",
                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            )}
        >
            <div className={cn("w-2 h-10 rounded-full shrink-0", STATUS_COLORS[device.status])} />

            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                {TYPE_ICONS[device.type]}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{device.name}</h3>
                    {device.alertCount > 0 && (
                        <span className="text-xs text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            {device.alertCount} alerts
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{device.ip} • {device.region}</p>
            </div>

            <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                    <p className="text-sm font-medium">{device.metrics.cpu}%</p>
                    <p className="text-xs text-muted-foreground">CPU</p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">{device.metrics.memory}%</p>
                    <p className="text-xs text-muted-foreground">MEM</p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">{device.metrics.disk}%</p>
                    <p className="text-xs text-muted-foreground">DISK</p>
                </div>
            </div>

            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </div>
    );
}

function MetricBar({ label, value }: { label: string; value: number }) {
    const color = value > 90 ? 'bg-red-500' : value > 75 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

interface DeviceDetailSidebarProps {
    device: Device;
    onClose: () => void;
}

function DeviceDetailSidebar({ device, onClose }: DeviceDetailSidebarProps) {
    return (
        <div className="w-[380px] border-l border-border bg-card/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[device.status])} />
                    <span className="font-medium">{device.name}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                    <XCircle size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Type & Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {TYPE_ICONS[device.type]}
                    </div>
                    <div>
                        <p className="text-sm capitalize font-medium">{device.type}</p>
                        <p className="text-xs text-muted-foreground">{device.ip}</p>
                    </div>
                </div>

                {/* Metrics */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Resource Usage</h4>
                    <div className="space-y-3">
                        <MetricRow icon={<Cpu size={14} />} label="CPU" value={device.metrics.cpu} />
                        <MetricRow icon={<MemoryStick size={14} />} label="Memory" value={device.metrics.memory} />
                        <MetricRow icon={<HardDrive size={14} />} label="Disk" value={device.metrics.disk} />
                    </div>
                </div>

                {/* Network */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Network</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Inbound</p>
                            <p className="font-medium">{device.metrics.network.in} Mbps</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Outbound</p>
                            <p className="font-medium">{device.metrics.network.out} Mbps</p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Details</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Region</span>
                            <span>{device.region}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Environment</span>
                            <span className="capitalize">{device.environment}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Uptime</span>
                            <span>{device.uptime}</span>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {device.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-muted rounded text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-2">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                    View Metrics
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Settings size={16} className="text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    const color = value > 90 ? 'text-red-500' : value > 75 ? 'text-amber-500' : 'text-emerald-500';
    const barColor = value > 90 ? 'bg-red-500' : value > 75 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{icon}</span>
            <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className={cn("font-medium", color)}>{value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", barColor)} style={{ width: `${value}%` }} />
                </div>
            </div>
        </div>
    );
}
