"use client";

import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Clock,
    Edit3,
    MoreVertical,
    Pause,
    Play,
    Plus,
    Search,
    Trash2,
    XCircle,
    Copy,
    History,
    Settings,
    ChevronRight,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RuleState = 'active' | 'paused' | 'error';
type RuleSeverity = 'critical' | 'warning' | 'info';

interface AlertRule {
    id: string;
    name: string;
    description: string;
    expr: string;
    forDuration: string;
    severity: RuleSeverity;
    state: RuleState;
    group: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    lastEvaluation?: string;
    evaluationTime?: number;
    firingCount: number;
    createdAt: string;
    updatedAt: string;
}

// Mock rules data
const MOCK_RULES: AlertRule[] = [
    {
        id: '1',
        name: 'HighCPUUsage',
        description: 'Alert when CPU usage exceeds 90% for 5 minutes',
        expr: '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90',
        forDuration: '5m',
        severity: 'critical',
        state: 'active',
        group: 'node-alerts',
        labels: { team: 'infrastructure' },
        annotations: { summary: 'High CPU usage on {{ $labels.instance }}' },
        lastEvaluation: new Date(Date.now() - 30000).toISOString(),
        evaluationTime: 12,
        firingCount: 1,
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2026-01-05T14:30:00Z',
    },
    {
        id: '2',
        name: 'HighMemoryUsage',
        description: 'Alert when memory usage exceeds 85% for 10 minutes',
        expr: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85',
        forDuration: '10m',
        severity: 'warning',
        state: 'active',
        group: 'node-alerts',
        labels: { team: 'infrastructure' },
        annotations: { summary: 'High memory usage on {{ $labels.instance }}' },
        lastEvaluation: new Date(Date.now() - 30000).toISOString(),
        evaluationTime: 8,
        firingCount: 2,
        createdAt: '2025-12-01T10:00:00Z',
        updatedAt: '2026-01-03T09:15:00Z',
    },
    {
        id: '3',
        name: 'DiskSpaceLow',
        description: 'Alert when disk space is below 10%',
        expr: '(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10',
        forDuration: '15m',
        severity: 'critical',
        state: 'active',
        group: 'node-alerts',
        labels: { team: 'infrastructure' },
        annotations: { summary: 'Low disk space on {{ $labels.instance }}' },
        lastEvaluation: new Date(Date.now() - 30000).toISOString(),
        evaluationTime: 15,
        firingCount: 1,
        createdAt: '2025-12-05T08:00:00Z',
        updatedAt: '2025-12-05T08:00:00Z',
    },
    {
        id: '4',
        name: 'ServiceDown',
        description: 'Alert when a service probe fails',
        expr: 'probe_success == 0',
        forDuration: '2m',
        severity: 'critical',
        state: 'active',
        group: 'blackbox-alerts',
        labels: { team: 'platform' },
        annotations: { summary: 'Service {{ $labels.instance }} is down' },
        lastEvaluation: new Date(Date.now() - 30000).toISOString(),
        evaluationTime: 5,
        firingCount: 0,
        createdAt: '2025-11-20T12:00:00Z',
        updatedAt: '2026-01-02T16:45:00Z',
    },
    {
        id: '5',
        name: 'HighRequestLatency',
        description: 'Alert when P95 latency exceeds 500ms',
        expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5',
        forDuration: '5m',
        severity: 'warning',
        state: 'paused',
        group: 'application-alerts',
        labels: { team: 'backend' },
        annotations: { summary: 'High latency on {{ $labels.service }}' },
        lastEvaluation: new Date(Date.now() - 300000).toISOString(),
        evaluationTime: 20,
        firingCount: 0,
        createdAt: '2025-12-10T14:00:00Z',
        updatedAt: '2026-01-08T11:00:00Z',
    },
    {
        id: '6',
        name: 'CertificateExpiry',
        description: 'Alert when SSL certificate expires within 14 days',
        expr: '(probe_ssl_earliest_cert_expiry - time()) / 86400 < 14',
        forDuration: '1h',
        severity: 'info',
        state: 'active',
        group: 'blackbox-alerts',
        labels: { team: 'security' },
        annotations: { summary: 'Certificate for {{ $labels.instance }} expires soon' },
        lastEvaluation: new Date(Date.now() - 30000).toISOString(),
        evaluationTime: 10,
        firingCount: 1,
        createdAt: '2025-11-15T09:00:00Z',
        updatedAt: '2025-11-15T09:00:00Z',
    },
];

export default function AlertRulesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | 'all'>('all');
    const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const groups = useMemo(() => {
        const groupSet = new Set(MOCK_RULES.map(r => r.group));
        return Array.from(groupSet);
    }, []);

    const filteredRules = useMemo(() => {
        return MOCK_RULES.filter(rule => {
            const matchesSearch =
                rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.expr.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesGroup = selectedGroup === 'all' || rule.group === selectedGroup;

            return matchesSearch && matchesGroup;
        });
    }, [searchQuery, selectedGroup]);

    const stats = useMemo(() => ({
        total: MOCK_RULES.length,
        active: MOCK_RULES.filter(r => r.state === 'active').length,
        paused: MOCK_RULES.filter(r => r.state === 'paused').length,
        firing: MOCK_RULES.filter(r => r.firingCount > 0).length,
    }), []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Zap size={20} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Alert Rules</h1>
                            <p className="text-sm text-muted-foreground">
                                Define and manage alerting conditions
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        New Rule
                    </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Active:</span>
                        <span className="font-medium">{stats.active}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Paused:</span>
                        <span className="font-medium">{stats.paused}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-muted-foreground">Firing:</span>
                        <span className="font-medium text-red-500">{stats.firing}</span>
                    </div>
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
                        placeholder="Search rules..."
                        className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                    />
                </div>

                <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                >
                    <option value="all">All Groups</option>
                    {groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="space-y-3">
                    {filteredRules.map(rule => (
                        <RuleCard
                            key={rule.id}
                            rule={rule}
                            onClick={() => setSelectedRule(rule)}
                        />
                    ))}
                </div>
            </div>

            {/* Rule Detail Modal */}
            {selectedRule && (
                <RuleDetailModal
                    rule={selectedRule}
                    onClose={() => setSelectedRule(null)}
                />
            )}

            {/* Create Rule Modal */}
            {isCreateModalOpen && (
                <CreateRuleModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
}

// ============== Components ==============

interface RuleCardProps {
    rule: AlertRule;
    onClick: () => void;
}

function RuleCard({ rule, onClick }: RuleCardProps) {
    const severityConfig = {
        critical: { color: 'bg-red-500', text: 'text-red-500' },
        warning: { color: 'bg-amber-500', text: 'text-amber-500' },
        info: { color: 'bg-blue-500', text: 'text-blue-500' },
    };

    const stateConfig = {
        active: { icon: <Play size={12} />, label: 'Active', color: 'text-emerald-500 bg-emerald-500/10' },
        paused: { icon: <Pause size={12} />, label: 'Paused', color: 'text-amber-500 bg-amber-500/10' },
        error: { icon: <XCircle size={12} />, label: 'Error', color: 'text-red-500 bg-red-500/10' },
    };

    const config = stateConfig[rule.state];

    return (
        <div
            onClick={onClick}
            className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer group"
        >
            <div className="flex items-start gap-4">
                {/* Severity indicator */}
                <div className={cn("w-1 h-12 rounded-full", severityConfig[rule.severity].color)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{rule.name}</h3>
                        <span className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            config.color
                        )}>
                            {config.icon}
                            {config.label}
                        </span>
                        {rule.firingCount > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
                                <AlertTriangle size={10} />
                                {rule.firingCount} firing
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            for {rule.forDuration}
                        </span>
                        <span>Group: {rule.group}</span>
                        {rule.lastEvaluation && (
                            <span>Last eval: {rule.evaluationTime}ms</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Edit3 size={14} className="text-muted-foreground" />
                    </button>
                    <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Copy size={14} className="text-muted-foreground" />
                    </button>
                    <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        {rule.state === 'active' ? (
                            <Pause size={14} className="text-muted-foreground" />
                        ) : (
                            <Play size={14} className="text-muted-foreground" />
                        )}
                    </button>
                </div>
            </div>

            {/* Expression Preview */}
            <div className="mt-3 ml-5 p-2 bg-muted/50 rounded-lg">
                <code className="text-xs font-mono text-muted-foreground line-clamp-1">
                    {rule.expr}
                </code>
            </div>
        </div>
    );
}

interface RuleDetailModalProps {
    rule: AlertRule;
    onClose: () => void;
}

function RuleDetailModal({ rule, onClose }: RuleDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold">{rule.name}</h2>
                        <p className="text-sm text-muted-foreground">{rule.group}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'details'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground"
                        )}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'history'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground"
                        )}
                    >
                        History
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-muted-foreground">Description</label>
                                <p className="text-sm mt-1">{rule.description}</p>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground">Expression</label>
                                <div className="mt-1 p-3 bg-muted rounded-lg">
                                    <code className="text-sm font-mono">{rule.expr}</code>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground">Severity</label>
                                    <p className="text-sm mt-1 capitalize">{rule.severity}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">For Duration</label>
                                    <p className="text-sm mt-1">{rule.forDuration}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground">Labels</label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {Object.entries(rule.labels).map(([k, v]) => (
                                        <span key={k} className="px-2 py-1 bg-muted rounded text-xs">
                                            {k}={v}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground">Annotations</label>
                                <div className="mt-1 space-y-2">
                                    {Object.entries(rule.annotations).map(([k, v]) => (
                                        <div key={k} className="p-2 bg-muted/50 rounded">
                                            <span className="text-xs text-muted-foreground">{k}</span>
                                            <p className="text-sm mt-0.5">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="text-center py-8 text-muted-foreground">
                            <History size={32} className="mx-auto mb-2 opacity-50" />
                            <p>Alert history coming soon</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border px-6 py-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Updated {new Date(rule.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
                            Delete
                        </button>
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                            Edit Rule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CreateRuleModalProps {
    onClose: () => void;
}

function CreateRuleModal({ onClose }: CreateRuleModalProps) {
    const [name, setName] = useState('');
    const [expr, setExpr] = useState('');
    const [forDuration, setForDuration] = useState('5m');
    const [severity, setSeverity] = useState<RuleSeverity>('warning');

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-bold">Create Alert Rule</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Rule Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="HighCPUUsage"
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">PromQL Expression</label>
                        <textarea
                            value={expr}
                            onChange={(e) => setExpr(e.target.value)}
                            placeholder="100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=&quot;idle&quot;}[5m])) * 100) > 90"
                            rows={3}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">For Duration</label>
                            <select
                                value={forDuration}
                                onChange={(e) => setForDuration(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                            >
                                <option value="1m">1 minute</option>
                                <option value="5m">5 minutes</option>
                                <option value="10m">10 minutes</option>
                                <option value="15m">15 minutes</option>
                                <option value="30m">30 minutes</option>
                                <option value="1h">1 hour</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Severity</label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as RuleSeverity)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                        Create Rule
                    </button>
                </div>
            </div>
        </div>
    );
}
