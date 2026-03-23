'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Wifi,
    WifiOff,
    Thermometer,
    Droplets,
    Activity,
    Zap,
    Radio,
    RefreshCw,
    Plus,
    Settings,
    Trash2,
    CheckCircle,
    AlertCircle,
    Clock,
    MapPin,
    ChevronRight,
    Server,
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { getMQTTService, SensorDevice, BrokerStatus, SensorMessage, MQTTBrokerConfig } from '@/lib/mqtt';

// Sensor type icons
const sensorIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    temperature: Thermometer,
    humidity: Droplets,
    pressure: Activity,
    power: Zap,
    motion: Radio,
    light: Activity,
};

export function MQTTSensorDashboard() {
    const [brokers, setBrokers] = useState<(MQTTBrokerConfig & { status: BrokerStatus })[]>([]);
    const [devices, setDevices] = useState<SensorDevice[]>([]);
    const [messages, setMessages] = useState<SensorMessage[]>([]);
    const [showAddBroker, setShowAddBroker] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<SensorDevice | null>(null);

    const mqttService = getMQTTService();

    const updateBrokerStates = useCallback(() => {
        const statuses = mqttService.getAllStatuses();
        // This is simplified - in real app, we'd store broker configs separately
        setBrokers(prev => {
            if (prev.length === 0) {
                return [{
                    id: 'demo-broker',
                    name: 'Demo IoT Broker',
                    host: 'mqtt.demo.local',
                    port: 1883,
                    protocol: 'mqtt' as const,
                    topics: [{ topic: 'sensors/#', qos: 1 as const, parser: 'json' as const }],
                    status: statuses.find(s => s.brokerId === 'demo-broker') || {
                        brokerId: 'demo-broker',
                        status: 'disconnected',
                        messagesReceived: 0,
                        bytesReceived: 0,
                    },
                }];
            }
            return prev.map(b => ({
                ...b,
                status: statuses.find(s => s.brokerId === b.id) || b.status,
            }));
        });
    }, [mqttService]);

    // Initialize with demo broker
    useEffect(() => {
        // Add demo broker
        const demoBroker: MQTTBrokerConfig = {
            id: 'demo-broker',
            name: 'Demo IoT Broker',
            host: 'mqtt.demo.local',
            port: 1883,
            protocol: 'mqtt',
            topics: [
                { topic: 'sensors/#', qos: 1, parser: 'json' },
            ],
        };

        mqttService.addBroker(demoBroker);

        // Listen for events
        const messageHandler = (message: SensorMessage) => {
            setMessages(prev => [message, ...prev].slice(0, 50));
            setDevices(mqttService.getDevices());
        };
        mqttService.on('message', messageHandler);
        mqttService.on('connectionStatus', updateBrokerStates);

        // Initial state
        updateBrokerStates();

        // Auto-connect demo broker
        mqttService.connect('demo-broker').catch(console.error);

        return () => {
            mqttService.removeListener('message', messageHandler);
            mqttService.removeListener('connectionStatus', updateBrokerStates);
        };
    }, [mqttService, updateBrokerStates]);

    const handleConnect = async (brokerId: string) => {
        try {
            await mqttService.connect(brokerId);
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    const handleDisconnect = (brokerId: string) => {
        mqttService.disconnect(brokerId);
        updateBrokerStates();
    };

    // Get stats
    const stats = {
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.status === 'online').length,
        totalMessages: brokers.reduce((sum, b) => sum + (b.status?.messagesReceived || 0), 0),
        totalBytes: brokers.reduce((sum, b) => sum + (b.status?.bytesReceived || 0), 0),
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                        <Radio size={20} className="text-cyan-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">MQTT Sensors</h1>
                        <p className="text-sm text-muted-foreground">
                            IoT sensor data from MQTT brokers
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddBroker(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                    <Plus size={16} />
                    Add Broker
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={<Server size={18} />}
                    label="Brokers"
                    value={brokers.length}
                    subtext={`${brokers.filter(b => b.status?.status === 'connected').length} connected`}
                    color="blue"
                />
                <StatCard
                    icon={<Radio size={18} />}
                    label="Devices"
                    value={stats.totalDevices}
                    subtext={`${stats.onlineDevices} online`}
                    color="emerald"
                />
                <StatCard
                    icon={<Activity size={18} />}
                    label="Messages"
                    value={stats.totalMessages}
                    subtext="received"
                    color="purple"
                />
                <StatCard
                    icon={<TrendingUp size={18} />}
                    label="Data"
                    value={formatBytes(stats.totalBytes)}
                    subtext="transferred"
                    color="amber"
                />
            </div>

            {/* Brokers */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium">Connected Brokers</h3>
                <div className="grid gap-3">
                    {brokers.map(broker => (
                        <BrokerCard
                            key={broker.id}
                            broker={broker}
                            onConnect={() => handleConnect(broker.id)}
                            onDisconnect={() => handleDisconnect(broker.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Devices Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Sensor Devices ({devices.length})</h3>
                    <button className="text-xs text-primary hover:underline">View all</button>
                </div>

                {devices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl">
                        <Radio size={40} className="text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No devices detected yet</p>
                        <p className="text-xs text-muted-foreground">Connect to a broker to start receiving sensor data</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {devices.map(device => (
                            <DeviceCard
                                key={device.id}
                                device={device}
                                onClick={() => setSelectedDevice(device)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Messages */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium">Recent Messages</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                    <div className="max-h-64 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium">Time</th>
                                    <th className="text-left px-4 py-2 font-medium">Topic</th>
                                    <th className="text-left px-4 py-2 font-medium">Payload</th>
                                </tr>
                            </thead>
                            <tbody>
                                {messages.map((msg, idx) => (
                                    <tr key={idx} className="border-t border-border hover:bg-muted/30">
                                        <td className="px-4 py-2 text-muted-foreground">
                                            {msg.timestamp.toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-xs text-primary">
                                            {msg.topic}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-xs truncate max-w-[300px]">
                                            {JSON.stringify(msg.payload)}
                                        </td>
                                    </tr>
                                ))}
                                {messages.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                            No messages yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Device Detail Modal */}
            {selectedDevice && (
                <DeviceDetailModal
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                />
            )}

            {/* Add Broker Modal */}
            <AddBrokerModal
                isOpen={showAddBroker}
                onClose={() => setShowAddBroker(false)}
                onAdd={(config) => {
                    mqttService.addBroker(config);
                    updateBrokerStates();
                    setShowAddBroker(false);
                }}
            />
        </div>
    );
}

// ============== Sub-components ==============

function StatCard({ icon, label, value, subtext, color }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext: string;
    color: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        purple: 'bg-purple-500/10 text-purple-500',
        amber: 'bg-amber-500/10 text-amber-500',
    };

    return (
        <div className="p-4 bg-card border border-border rounded-xl">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", colors[color])}>
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">
                {label} • {subtext}
            </p>
        </div>
    );
}

function BrokerCard({ broker, onConnect, onDisconnect }: {
    broker: MQTTBrokerConfig & { status: BrokerStatus };
    onConnect: () => void;
    onDisconnect: () => void;
}) {
    const isConnected = broker.status?.status === 'connected';
    const isConnecting = broker.status?.status === 'connecting';

    return (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isConnected ? "bg-emerald-500/10" : "bg-muted"
                )}>
                    {isConnected ? (
                        <Wifi size={18} className="text-emerald-500" />
                    ) : (
                        <WifiOff size={18} className="text-muted-foreground" />
                    )}
                </div>
                <div>
                    <h4 className="font-medium">{broker.name}</h4>
                    <p className="text-xs text-muted-foreground">
                        {broker.protocol}://{broker.host}:{broker.port}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {isConnected && (
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{broker.status.messagesReceived}</span> msgs
                    </div>
                )}

                <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    isConnected ? "bg-emerald-500/10 text-emerald-500" :
                        isConnecting ? "bg-amber-500/10 text-amber-500" :
                            "bg-muted text-muted-foreground"
                )}>
                    {broker.status?.status || 'disconnected'}
                </span>

                {isConnected ? (
                    <button
                        onClick={onDisconnect}
                        className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        onClick={onConnect}
                        disabled={isConnecting}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                )}
            </div>
        </div>
    );
}

function DeviceCard({ device, onClick }: {
    device: SensorDevice;
    onClick: () => void;
}) {
    const Icon = sensorIcons[device.type] || Activity;
    const latestMetric = device.metrics[device.metrics.length - 1];

    // Calculate trend
    const prevMetric = device.metrics[device.metrics.length - 2];
    const trend = prevMetric
        ? latestMetric.value > prevMetric.value ? 'up' : latestMetric.value < prevMetric.value ? 'down' : 'stable'
        : 'stable';

    return (
        <div
            onClick={onClick}
            className="p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        device.status === 'online' ? "bg-emerald-500/10" : "bg-muted"
                    )}>
                        <Icon size={16} className={device.status === 'online' ? "text-emerald-500" : "text-muted-foreground"} />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium">{device.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{device.type}</p>
                    </div>
                </div>
                <span className={cn(
                    "w-2 h-2 rounded-full",
                    device.status === 'online' ? "bg-emerald-500" : "bg-muted-foreground"
                )} />
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold">
                        {latestMetric?.value.toFixed(1)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                            {latestMetric?.unit}
                        </span>
                    </p>
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-xs",
                    trend === 'up' ? "text-emerald-500" : trend === 'down' ? "text-red-500" : "text-muted-foreground"
                )}>
                    {trend === 'up' && <TrendingUp size={12} />}
                    {trend === 'down' && <TrendingDown size={12} />}
                    {trend === 'stable' && <Minus size={12} />}
                </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <MapPin size={10} />
                {device.location}
                <Clock size={10} className="ml-2" />
                {formatTimeAgo(device.lastSeen)}
            </div>
        </div>
    );
}

function DeviceDetailModal({ device, onClose }: {
    device: SensorDevice;
    onClose: () => void;
}) {
    const Icon = sensorIcons[device.type] || Activity;

    return (
        <Modal isOpen={true} onClose={onClose} title={device.name} size="md">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon size={24} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold">{device.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {device.id} • {device.location}
                        </p>
                    </div>
                    <span className={cn(
                        "ml-auto px-3 py-1 rounded-full text-sm font-medium",
                        device.status === 'online' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                    )}>
                        {device.status}
                    </span>
                </div>

                {/* Current Value */}
                <div className="p-4 bg-muted/30 rounded-xl text-center">
                    <p className="text-4xl font-bold">
                        {device.metrics[device.metrics.length - 1]?.value.toFixed(1)}
                        <span className="text-lg font-normal text-muted-foreground ml-2">
                            {device.metrics[device.metrics.length - 1]?.unit}
                        </span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Current reading</p>
                </div>

                {/* History */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Recent Readings</h4>
                    <div className="space-y-2">
                        {device.metrics.slice(-5).reverse().map((metric, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {new Date(metric.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-sm font-medium">
                                    {metric.value.toFixed(2)} {metric.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function AddBrokerModal({ isOpen, onClose, onAdd }: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (config: MQTTBrokerConfig) => void;
}) {
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('1883');
    const [protocol, setProtocol] = useState<'mqtt' | 'mqtts' | 'ws' | 'wss'>('mqtt');

    const handleSubmit = () => {
        if (!name || !host) return;

        onAdd({
            id: `broker-${Date.now()}`,
            name,
            host,
            port: parseInt(port),
            protocol,
            topics: [{ topic: '#', qos: 1, parser: 'json' }],
        });

        // Reset
        setName('');
        setHost('');
        setPort('1883');
        setProtocol('mqtt');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add MQTT Broker" size="sm">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My IoT Broker"
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Host</label>
                    <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="mqtt.example.com"
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Port</label>
                        <input
                            type="number"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Protocol</label>
                        <select
                            value={protocol}
                            onChange={(e) => setProtocol(e.target.value as typeof protocol)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="mqtt">MQTT</option>
                            <option value="mqtts">MQTT/TLS</option>
                            <option value="ws">WebSocket</option>
                            <option value="wss">WebSocket/TLS</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name || !host}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                        Add Broker
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ============== Utilities ==============

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

export default MQTTSensorDashboard;
