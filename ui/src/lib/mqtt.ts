/**
 * MQTT Sensor Integration Service
 * 
 * This service provides integration with MQTT brokers for collecting
 * sensor data from IoT devices. It supports:
 * - Multiple broker connections
 * - Topic subscriptions with wildcards
 * - Message parsing (JSON, CSV, raw)
 * - Metric conversion for Prometheus/Thanos
 */

import { EventEmitter } from 'events';

// MQTT message types
export interface MQTTBrokerConfig {
    id: string;
    name: string;
    host: string;
    port: number;
    protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss';
    username?: string;
    password?: string;
    clientId?: string;
    keepAlive?: number;
    connectTimeout?: number;
    reconnectPeriod?: number;
    topics: TopicSubscription[];
}

export interface TopicSubscription {
    topic: string;
    qos: 0 | 1 | 2;
    parser: 'json' | 'csv' | 'raw';
    metricMapping?: MetricMapping[];
}

export interface MetricMapping {
    field: string;
    metricName: string;
    labels?: Record<string, string>;
    type: 'gauge' | 'counter' | 'histogram';
    unit?: string;
}

export interface SensorMessage {
    topic: string;
    payload: unknown;
    timestamp: Date;
    brokerId: string;
    qos: number;
    retained: boolean;
}

export interface SensorMetric {
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp: number;
    type: 'gauge' | 'counter' | 'histogram';
    unit?: string;
}

export interface SensorDevice {
    id: string;
    name: string;
    type: 'temperature' | 'humidity' | 'pressure' | 'motion' | 'light' | 'power' | 'custom';
    location?: string;
    lastSeen: Date;
    status: 'online' | 'offline' | 'unknown';
    batteryLevel?: number;
    metrics: SensorMetric[];
}

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface BrokerStatus {
    brokerId: string;
    status: ConnectionStatus;
    error?: string;
    lastConnected?: Date;
    messagesReceived: number;
    bytesReceived: number;
}

// Event types
export interface MQTTServiceEvents {
    message: (message: SensorMessage) => void;
    metric: (metric: SensorMetric) => void;
    connectionStatus: (status: BrokerStatus) => void;
    error: (error: Error) => void;
}

/**
 * MQTT Service for sensor data collection
 */
export class MQTTSensorService extends EventEmitter {
    private brokers: Map<string, MQTTBrokerConfig> = new Map();
    private statuses: Map<string, BrokerStatus> = new Map();
    private devices: Map<string, SensorDevice> = new Map();

    constructor() {
        super();
    }

    /**
     * Add a broker configuration
     */
    addBroker(config: MQTTBrokerConfig): void {
        this.brokers.set(config.id, config);
        this.statuses.set(config.id, {
            brokerId: config.id,
            status: 'disconnected',
            messagesReceived: 0,
            bytesReceived: 0,
        });
    }

    /**
     * Remove a broker
     */
    removeBroker(brokerId: string): void {
        this.brokers.delete(brokerId);
        this.statuses.delete(brokerId);
    }

    /**
     * Connect to a broker (simulated for browser environment)
     */
    async connect(brokerId: string): Promise<void> {
        const broker = this.brokers.get(brokerId);
        if (!broker) {
            throw new Error(`Broker ${brokerId} not found`);
        }

        this.updateStatus(brokerId, 'connecting');

        // In a real implementation, this would use a WebSocket MQTT client
        // For demo, we simulate the connection
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.updateStatus(brokerId, 'connected', {
                lastConnected: new Date(),
            });

            // Start simulating sensor data
            this.startSimulation(brokerId);
        } catch (error) {
            this.updateStatus(brokerId, 'error', {
                error: error instanceof Error ? error.message : 'Connection failed',
            });
            throw error;
        }
    }

    /**
     * Disconnect from a broker
     */
    disconnect(brokerId: string): void {
        this.updateStatus(brokerId, 'disconnected');
    }

    /**
     * Get broker status
     */
    getStatus(brokerId: string): BrokerStatus | undefined {
        return this.statuses.get(brokerId);
    }

    /**
     * Get all broker statuses
     */
    getAllStatuses(): BrokerStatus[] {
        return Array.from(this.statuses.values());
    }

    /**
     * Get all discovered devices
     */
    getDevices(): SensorDevice[] {
        return Array.from(this.devices.values());
    }

    /**
     * Parse incoming message based on topic configuration
     */
    private parseMessage(topic: string, payload: Buffer, broker: MQTTBrokerConfig): SensorMessage {
        const subscription = broker.topics.find(t => this.matchTopic(t.topic, topic));
        const parser = subscription?.parser || 'raw';

        let parsedPayload: unknown;
        const payloadStr = payload.toString();

        switch (parser) {
            case 'json':
                try {
                    parsedPayload = JSON.parse(payloadStr);
                } catch {
                    parsedPayload = payloadStr;
                }
                break;
            case 'csv':
                parsedPayload = payloadStr.split(',').map(v => v.trim());
                break;
            default:
                parsedPayload = payloadStr;
        }

        return {
            topic,
            payload: parsedPayload,
            timestamp: new Date(),
            brokerId: broker.id,
            qos: subscription?.qos || 0,
            retained: false,
        };
    }

    /**
     * Match topic with wildcards
     */
    private matchTopic(pattern: string, topic: string): boolean {
        const patternParts = pattern.split('/');
        const topicParts = topic.split('/');

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] === '#') {
                return true;
            }
            if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
                return false;
            }
        }

        return patternParts.length === topicParts.length;
    }

    /**
     * Convert message to metrics based on mapping
     */
    private messageToMetrics(message: SensorMessage, mapping?: MetricMapping[]): SensorMetric[] {
        if (!mapping || !mapping.length) {
            return [];
        }

        const payload = message.payload as Record<string, unknown>;
        const metrics: SensorMetric[] = [];

        for (const map of mapping) {
            const value = this.getNestedValue(payload, map.field);
            if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
                metrics.push({
                    name: map.metricName,
                    value: typeof value === 'number' ? value : parseFloat(value),
                    labels: {
                        topic: message.topic,
                        broker: message.brokerId,
                        ...map.labels,
                    },
                    timestamp: Date.now(),
                    type: map.type,
                    unit: map.unit,
                });
            }
        }

        return metrics;
    }

    /**
     * Get nested value from object
     */
    private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce((acc: unknown, part: string) => {
            if (acc && typeof acc === 'object') {
                return (acc as Record<string, unknown>)[part];
            }
            return undefined;
        }, obj);
    }

    /**
     * Update broker status
     */
    private updateStatus(brokerId: string, status: ConnectionStatus, extra: Partial<BrokerStatus> = {}): void {
        const current = this.statuses.get(brokerId) || {
            brokerId,
            status: 'disconnected',
            messagesReceived: 0,
            bytesReceived: 0,
        };

        const updated: BrokerStatus = {
            ...current,
            status,
            ...extra,
        };

        this.statuses.set(brokerId, updated);
        this.emit('connectionStatus', updated);
    }

    /**
     * Start simulation for demo purposes
     */
    private startSimulation(brokerId: string): void {
        const broker = this.brokers.get(brokerId);
        if (!broker) return;

        // Simulate sensor messages every 5 seconds
        const interval = setInterval(() => {
            const status = this.statuses.get(brokerId);
            if (!status || status.status !== 'connected') {
                clearInterval(interval);
                return;
            }

            // Generate mock sensor data
            const sensors = [
                { id: 'sensor-001', type: 'temperature', location: 'datacenter-1', value: 22 + Math.random() * 5 },
                { id: 'sensor-002', type: 'humidity', location: 'datacenter-1', value: 40 + Math.random() * 20 },
                { id: 'sensor-003', type: 'temperature', location: 'datacenter-2', value: 21 + Math.random() * 6 },
                { id: 'sensor-004', type: 'power', location: 'datacenter-1', value: 150 + Math.random() * 50 },
                { id: 'sensor-005', type: 'pressure', location: 'datacenter-1', value: 1010 + Math.random() * 20 },
            ];

            for (const sensor of sensors) {
                const message: SensorMessage = {
                    topic: `sensors/${sensor.location}/${sensor.type}/${sensor.id}`,
                    payload: {
                        value: sensor.value,
                        unit: this.getUnit(sensor.type),
                        timestamp: Date.now(),
                    },
                    timestamp: new Date(),
                    brokerId,
                    qos: 1,
                    retained: false,
                };

                // Update status
                const currentStatus = this.statuses.get(brokerId)!;
                this.statuses.set(brokerId, {
                    ...currentStatus,
                    messagesReceived: currentStatus.messagesReceived + 1,
                    bytesReceived: currentStatus.bytesReceived + JSON.stringify(message.payload).length,
                });

                // Emit message
                this.emit('message', message);

                // Update device tracking
                this.updateDevice(sensor.id, sensor.type as SensorDevice['type'], sensor.location, sensor.value);
            }
        }, 5000);
    }

    /**
     * Update device tracking
     */
    private updateDevice(id: string, type: SensorDevice['type'], location: string, value: number): void {
        const existing = this.devices.get(id);

        const device: SensorDevice = {
            id,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensor ${id.slice(-3)}`,
            type,
            location,
            lastSeen: new Date(),
            status: 'online',
            metrics: [{
                name: `sensor_${type}`,
                value,
                labels: { sensor_id: id, location },
                timestamp: Date.now(),
                type: 'gauge',
                unit: this.getUnit(type),
            }],
        };

        if (existing) {
            device.metrics = [...existing.metrics.slice(-10), ...device.metrics];
        }

        this.devices.set(id, device);
    }

    /**
     * Get unit for sensor type
     */
    private getUnit(type: string): string {
        switch (type) {
            case 'temperature': return '°C';
            case 'humidity': return '%';
            case 'pressure': return 'hPa';
            case 'power': return 'W';
            case 'light': return 'lux';
            default: return '';
        }
    }
}

// Singleton instance
let mqttService: MQTTSensorService | null = null;

export function getMQTTService(): MQTTSensorService {
    if (!mqttService) {
        mqttService = new MQTTSensorService();
    }
    return mqttService;
}

export default MQTTSensorService;
