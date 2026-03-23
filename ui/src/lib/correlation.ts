/**
 * Correlation Rule Engine
 * 
 * Correlates multiple events across time windows to detect complex attack patterns.
 * Supports:
 * - Temporal correlation (events within time windows)
 * - Threshold correlation (count-based)
 * - Sequence correlation (ordered events)
 * - Pattern correlation (regex/similarity)
 */

import { EventEmitter } from 'events';

// Event types
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    source: {
        ip?: string;
        hostname?: string;
        user?: string;
        process?: string;
    };
    destination?: {
        ip?: string;
        port?: number;
        hostname?: string;
    };
    action: string;
    outcome: 'success' | 'failure' | 'unknown';
    raw: Record<string, unknown>;
    labels: Record<string, string>;
}

// Correlation rule types
export type CorrelationType = 'threshold' | 'sequence' | 'timewindow' | 'unique' | 'pattern';

export interface CorrelationRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    type: CorrelationType;
    severity: 'critical' | 'high' | 'medium' | 'low';

    // Conditions
    conditions: CorrelationCondition[];

    // Time window
    timeWindow: number; // seconds

    // Threshold (for threshold/unique type)
    threshold?: number;

    // Group by fields
    groupBy?: string[];

    // Sequence order (for sequence type)
    orderedSequence?: boolean;

    // Pattern match (for pattern type)
    pattern?: string;

    // Actions
    actions: CorrelationAction[];

    // Metadata
    tags: string[];
    mitreTactics?: string[];
    mitreIds?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CorrelationCondition {
    id: string;
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
    value: unknown;
    eventType?: string; // For sequence rules
}

export interface CorrelationAction {
    type: 'alert' | 'notification' | 'webhook' | 'runbook' | 'block';
    config: Record<string, unknown>;
}

// Correlation match/alert
export interface CorrelationAlert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: string;
    timestamp: Date;
    events: SecurityEvent[];
    groupKey: string;
    context: Record<string, unknown>;
    status: 'new' | 'acknowledged' | 'resolved' | 'suppressed';
}

// Event window for tracking events per group
interface EventWindow {
    groupKey: string;
    events: SecurityEvent[];
    firstEventTime: Date;
    lastEventTime: Date;
    matchedConditions: Set<string>;
}

/**
 * Correlation Rule Engine
 */
export class CorrelationEngine extends EventEmitter {
    private rules: Map<string, CorrelationRule> = new Map();
    private eventWindows: Map<string, Map<string, EventWindow>> = new Map(); // ruleId -> groupKey -> window
    private alerts: CorrelationAlert[] = [];
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startCleanup();
    }

    /**
     * Add a correlation rule
     */
    addRule(rule: CorrelationRule): void {
        this.rules.set(rule.id, rule);
        this.eventWindows.set(rule.id, new Map());
        this.emit('ruleAdded', rule);
    }

    /**
     * Remove a correlation rule
     */
    removeRule(ruleId: string): void {
        this.rules.delete(ruleId);
        this.eventWindows.delete(ruleId);
        this.emit('ruleRemoved', ruleId);
    }

    /**
     * Get all rules
     */
    getRules(): CorrelationRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Get rule by ID
     */
    getRule(ruleId: string): CorrelationRule | undefined {
        return this.rules.get(ruleId);
    }

    /**
     * Update a rule
     */
    updateRule(ruleId: string, updates: Partial<CorrelationRule>): void {
        const rule = this.rules.get(ruleId);
        if (rule) {
            this.rules.set(ruleId, { ...rule, ...updates, updatedAt: new Date().toISOString() });
            this.emit('ruleUpdated', this.rules.get(ruleId));
        }
    }

    /**
     * Process an incoming event
     */
    processEvent(event: SecurityEvent): CorrelationAlert[] {
        const triggeredAlerts: CorrelationAlert[] = [];

        for (const rule of this.rules.values()) {
            if (!rule.enabled) continue;

            const alerts = this.evaluateRule(rule, event);
            triggeredAlerts.push(...alerts);
        }

        // Store alerts
        this.alerts.push(...triggeredAlerts);

        // Emit alerts
        for (const alert of triggeredAlerts) {
            this.emit('alert', alert);
        }

        return triggeredAlerts;
    }

    /**
     * Evaluate a rule against an event
     */
    private evaluateRule(rule: CorrelationRule, event: SecurityEvent): CorrelationAlert[] {
        const alerts: CorrelationAlert[] = [];

        // Check if event matches any condition
        const matchedCondition = this.findMatchingCondition(rule.conditions, event);
        if (!matchedCondition) {
            return alerts;
        }

        // Generate group key
        const groupKey = this.generateGroupKey(rule, event);

        // Get or create event window
        let ruleWindows = this.eventWindows.get(rule.id);
        if (!ruleWindows) {
            ruleWindows = new Map();
            this.eventWindows.set(rule.id, ruleWindows);
        }

        let window = ruleWindows.get(groupKey);
        const now = new Date();
        const windowStart = new Date(now.getTime() - rule.timeWindow * 1000);

        // Clean expired events from window
        if (window) {
            window.events = window.events.filter(e => e.timestamp >= windowStart);
            if (window.events.length === 0) {
                ruleWindows.delete(groupKey);
                window = undefined;
            }
        }

        // Create new window if needed
        if (!window) {
            window = {
                groupKey,
                events: [],
                firstEventTime: event.timestamp,
                lastEventTime: event.timestamp,
                matchedConditions: new Set(),
            };
            ruleWindows.set(groupKey, window);
        }

        // Add event to window
        window.events.push(event);
        window.lastEventTime = event.timestamp;
        window.matchedConditions.add(matchedCondition.id);

        // Evaluate based on rule type
        let triggered = false;

        switch (rule.type) {
            case 'threshold':
                triggered = window.events.length >= (rule.threshold || 1);
                break;

            case 'unique':
                const uniqueField = rule.conditions[0]?.field || 'source.ip';
                const uniqueValues = new Set(window.events.map(e => this.getFieldValue(e, uniqueField)));
                triggered = uniqueValues.size >= (rule.threshold || 1);
                break;

            case 'sequence':
                triggered = this.checkSequence(rule, window);
                break;

            case 'timewindow':
                // Trigger if events exist in window
                triggered = window.events.length >= (rule.threshold || 1);
                break;

            case 'pattern':
                triggered = this.checkPattern(rule, window);
                break;
        }

        // Generate alert if triggered
        if (triggered) {
            const alert: CorrelationAlert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                timestamp: new Date(),
                events: [...window.events],
                groupKey,
                context: {
                    eventCount: window.events.length,
                    timeSpan: window.lastEventTime.getTime() - window.firstEventTime.getTime(),
                    matchedConditions: Array.from(window.matchedConditions),
                },
                status: 'new',
            };

            alerts.push(alert);

            // Clear window after triggering to prevent duplicate alerts
            ruleWindows.delete(groupKey);
        }

        return alerts;
    }

    /**
     * Find matching condition
     */
    private findMatchingCondition(conditions: CorrelationCondition[], event: SecurityEvent): CorrelationCondition | null {
        for (const condition of conditions) {
            if (this.evaluateCondition(condition, event)) {
                return condition;
            }
        }
        return null;
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(condition: CorrelationCondition, event: SecurityEvent): boolean {
        const fieldValue = this.getFieldValue(event, condition.field);
        const conditionValue = condition.value;

        switch (condition.operator) {
            case 'equals':
                return fieldValue === conditionValue;
            case 'not_equals':
                return fieldValue !== conditionValue;
            case 'contains':
                return String(fieldValue).includes(String(conditionValue));
            case 'regex':
                return new RegExp(String(conditionValue)).test(String(fieldValue));
            case 'gt':
                return Number(fieldValue) > Number(conditionValue);
            case 'lt':
                return Number(fieldValue) < Number(conditionValue);
            case 'gte':
                return Number(fieldValue) >= Number(conditionValue);
            case 'lte':
                return Number(fieldValue) <= Number(conditionValue);
            case 'in':
                return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
            case 'not_in':
                return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
            default:
                return false;
        }
    }

    /**
     * Get field value from event using dot notation
     */
    private getFieldValue(event: SecurityEvent, field: string): unknown {
        const parts = field.split('.');
        let value: unknown = event;

        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = (value as Record<string, unknown>)[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Generate group key based on groupBy fields
     */
    private generateGroupKey(rule: CorrelationRule, event: SecurityEvent): string {
        if (!rule.groupBy || rule.groupBy.length === 0) {
            return 'default';
        }

        const parts = rule.groupBy.map(field => {
            const value = this.getFieldValue(event, field);
            return `${field}=${value}`;
        });

        return parts.join('|');
    }

    /**
     * Check if event sequence matches rule
     */
    private checkSequence(rule: CorrelationRule, window: EventWindow): boolean {
        if (!rule.orderedSequence) {
            // Just check all conditions are matched
            return window.matchedConditions.size >= rule.conditions.length;
        }

        // Check order
        const conditionOrder = rule.conditions.map(c => c.id);
        let lastIndex = -1;

        for (const event of window.events) {
            for (let i = 0; i < rule.conditions.length; i++) {
                if (i > lastIndex && this.evaluateCondition(rule.conditions[i], event)) {
                    lastIndex = i;
                    break;
                }
            }
        }

        return lastIndex === rule.conditions.length - 1;
    }

    /**
     * Check pattern matching
     */
    private checkPattern(rule: CorrelationRule, window: EventWindow): boolean {
        if (!rule.pattern) return false;

        const pattern = new RegExp(rule.pattern);
        return window.events.some(e => pattern.test(JSON.stringify(e.raw)));
    }

    /**
     * Get all alerts
     */
    getAlerts(status?: CorrelationAlert['status']): CorrelationAlert[] {
        if (status) {
            return this.alerts.filter(a => a.status === status);
        }
        return [...this.alerts];
    }

    /**
     * Update alert status
     */
    updateAlertStatus(alertId: string, status: CorrelationAlert['status']): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = status;
            this.emit('alertUpdated', alert);
        }
    }

    /**
     * Start cleanup interval
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = new Date();

            for (const [ruleId, windows] of this.eventWindows) {
                const rule = this.rules.get(ruleId);
                if (!rule) continue;

                const windowStart = new Date(now.getTime() - rule.timeWindow * 1000);

                for (const [groupKey, window] of windows) {
                    window.events = window.events.filter(e => e.timestamp >= windowStart);
                    if (window.events.length === 0) {
                        windows.delete(groupKey);
                    }
                }
            }
        }, 60000); // Clean every minute
    }

    /**
     * Stop the engine
     */
    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Singleton instance
let correlationEngine: CorrelationEngine | null = null;

export function getCorrelationEngine(): CorrelationEngine {
    if (!correlationEngine) {
        correlationEngine = new CorrelationEngine();
        initializeDefaultRules(correlationEngine);
    }
    return correlationEngine;
}

/**
 * Initialize with default correlation rules
 */
function initializeDefaultRules(engine: CorrelationEngine): void {
    // Brute Force Detection
    engine.addRule({
        id: 'rule-brute-force',
        name: 'Brute Force Attack Detection',
        description: 'Detects multiple failed login attempts from the same source',
        enabled: true,
        type: 'threshold',
        severity: 'high',
        conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'authentication' },
            { id: 'cond-2', field: 'outcome', operator: 'equals', value: 'failure' },
        ],
        timeWindow: 300, // 5 minutes
        threshold: 5,
        groupBy: ['source.ip', 'destination.hostname'],
        actions: [{ type: 'alert', config: {} }],
        tags: ['authentication', 'brute-force'],
        mitreTactics: ['Credential Access'],
        mitreIds: ['T1110'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    // Port Scan Detection
    engine.addRule({
        id: 'rule-port-scan',
        name: 'Port Scan Detection',
        description: 'Detects scanning activity targeting multiple ports',
        enabled: true,
        type: 'unique',
        severity: 'medium',
        conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'connection' },
            { id: 'cond-2', field: 'outcome', operator: 'equals', value: 'failure' },
        ],
        timeWindow: 60, // 1 minute
        threshold: 10, // 10 unique ports
        groupBy: ['source.ip'],
        actions: [{ type: 'alert', config: {} }],
        tags: ['network', 'reconnaissance'],
        mitreTactics: ['Reconnaissance'],
        mitreIds: ['T1046'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    // Lateral Movement Detection
    engine.addRule({
        id: 'rule-lateral-movement',
        name: 'Lateral Movement Detection',
        description: 'Detects potential lateral movement patterns',
        enabled: true,
        type: 'sequence',
        severity: 'critical',
        conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'authentication', eventType: 'login' },
            { id: 'cond-2', field: 'action', operator: 'contains', value: 'remote', eventType: 'remote_access' },
            { id: 'cond-3', field: 'type', operator: 'equals', value: 'file_access', eventType: 'file' },
        ],
        orderedSequence: true,
        timeWindow: 600, // 10 minutes
        groupBy: ['source.user'],
        actions: [{ type: 'alert', config: {} }, { type: 'runbook', config: { runbookId: 'rb-isolate-host' } }],
        tags: ['lateral-movement', 'advanced-threat'],
        mitreTactics: ['Lateral Movement'],
        mitreIds: ['T1021'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    // Data Exfiltration Detection
    engine.addRule({
        id: 'rule-data-exfil',
        name: 'Data Exfiltration Detection',
        description: 'Detects unusual large data transfers',
        enabled: true,
        type: 'threshold',
        severity: 'critical',
        conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'network_traffic' },
            { id: 'cond-2', field: 'raw.bytes_out', operator: 'gt', value: 10485760 }, // 10MB
        ],
        timeWindow: 300, // 5 minutes
        threshold: 3,
        groupBy: ['source.ip', 'destination.ip'],
        actions: [{ type: 'alert', config: {} }, { type: 'block', config: {} }],
        tags: ['exfiltration', 'data-loss'],
        mitreTactics: ['Exfiltration'],
        mitreIds: ['T1041'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}

export default CorrelationEngine;
