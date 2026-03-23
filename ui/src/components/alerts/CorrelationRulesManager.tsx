'use client';

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Play,
    Pause,
    Pencil,
    Trash2,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ChevronRight,
    Activity,
    Target,
    Layers,
    GitBranch,
    Hash,
    Regex,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { getCorrelationEngine, CorrelationRule, CorrelationAlert, CorrelationType } from '@/lib/correlation';

const typeIcons: Record<CorrelationType, React.ComponentType<{ size?: number; className?: string }>> = {
    threshold: Hash,
    sequence: GitBranch,
    timewindow: Clock,
    unique: Target,
    pattern: Regex,
};

const typeLabels: Record<CorrelationType, string> = {
    threshold: 'Threshold',
    sequence: 'Sequence',
    timewindow: 'Time Window',
    unique: 'Unique Count',
    pattern: 'Pattern Match',
};

export function CorrelationRulesManager() {
    const [rules, setRules] = useState<CorrelationRule[]>([]);
    const [alerts, setAlerts] = useState<CorrelationAlert[]>([]);
    const [selectedRule, setSelectedRule] = useState<CorrelationRule | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<CorrelationType | 'all'>('all');

    const engine = getCorrelationEngine();

    useEffect(() => {
        // Load rules
        setRules(engine.getRules());
        setAlerts(engine.getAlerts());

        // Listen for updates
        const handleAlert = (alert: CorrelationAlert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 100));
        };

        engine.on('alert', handleAlert);

        return () => {
            engine.off('alert', handleAlert);
        };
    }, []);

    // Filter rules
    const filteredRules = rules.filter(rule => {
        if (filterType !== 'all' && rule.type !== filterType) return false;
        if (searchQuery && !rule.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Stats
    const stats = {
        total: rules.length,
        enabled: rules.filter(r => r.enabled).length,
        critical: rules.filter(r => r.severity === 'critical').length,
        alertsToday: alerts.filter(a =>
            new Date(a.timestamp).toDateString() === new Date().toDateString()
        ).length,
    };

    const handleToggleRule = (ruleId: string) => {
        const rule = rules.find(r => r.id === ruleId);
        if (rule) {
            engine.updateRule(ruleId, { enabled: !rule.enabled });
            setRules(engine.getRules());
        }
    };

    const handleDeleteRule = () => {
        if (selectedRule) {
            engine.removeRule(selectedRule.id);
            setRules(engine.getRules());
            setSelectedRule(null);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Shield size={20} className="text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Correlation Rules</h1>
                        <p className="text-sm text-muted-foreground">
                            Detect complex attack patterns across events
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                    <Plus size={16} />
                    Create Rule
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={<Layers size={18} />}
                    label="Total Rules"
                    value={stats.total}
                    color="blue"
                />
                <StatCard
                    icon={<CheckCircle size={18} />}
                    label="Enabled"
                    value={stats.enabled}
                    color="emerald"
                />
                <StatCard
                    icon={<AlertTriangle size={18} />}
                    label="Critical Rules"
                    value={stats.critical}
                    color="red"
                />
                <StatCard
                    icon={<Activity size={18} />}
                    label="Alerts Today"
                    value={stats.alertsToday}
                    color="amber"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search rules..."
                        className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-muted-foreground" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as CorrelationType | 'all')}
                        className="px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                    >
                        <option value="all">All Types</option>
                        {Object.entries(typeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Rules List */}
            <div className="space-y-3">
                {filteredRules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl">
                        <Shield size={40} className="text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No correlation rules found</p>
                    </div>
                ) : (
                    filteredRules.map(rule => (
                        <RuleCard
                            key={rule.id}
                            rule={rule}
                            alertCount={alerts.filter(a => a.ruleId === rule.id).length}
                            onToggle={() => handleToggleRule(rule.id)}
                            onEdit={() => setSelectedRule(rule)}
                            onDelete={() => { setSelectedRule(rule); setShowDeleteConfirm(true); }}
                        />
                    ))
                )}
            </div>

            {/* Recent Alerts */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium">Recent Correlation Alerts</h3>
                {alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No alerts triggered yet</p>
                ) : (
                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium">Time</th>
                                    <th className="text-left px-4 py-2 font-medium">Rule</th>
                                    <th className="text-left px-4 py-2 font-medium">Severity</th>
                                    <th className="text-left px-4 py-2 font-medium">Events</th>
                                    <th className="text-left px-4 py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.slice(0, 10).map(alert => (
                                    <tr key={alert.id} className="border-t border-border hover:bg-muted/30">
                                        <td className="px-4 py-2 text-muted-foreground">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-2 font-medium">{alert.ruleName}</td>
                                        <td className="px-4 py-2">
                                            <SeverityBadge severity={alert.severity} />
                                        </td>
                                        <td className="px-4 py-2">{alert.events.length}</td>
                                        <td className="px-4 py-2">
                                            <StatusBadge status={alert.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <CreateRuleModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={(rule) => {
                        engine.addRule(rule);
                        setRules(engine.getRules());
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setSelectedRule(null); }}
                onConfirm={handleDeleteRule}
                title="Delete Rule"
                description={`Are you sure you want to delete "${selectedRule?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </div>
    );
}

// ============== Sub-components ==============

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'blue' | 'emerald' | 'red' | 'amber';
}) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        red: 'bg-red-500/10 text-red-500',
        amber: 'bg-amber-500/10 text-amber-500',
    };

    return (
        <div className="p-4 bg-card border border-border rounded-xl">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", colors[color])}>
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function RuleCard({ rule, alertCount, onToggle, onEdit, onDelete }: {
    rule: CorrelationRule;
    alertCount: number;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const TypeIcon = typeIcons[rule.type] || Activity;

    return (
        <div className={cn(
            "p-4 bg-card border rounded-xl transition-all",
            rule.enabled ? "border-border" : "border-border opacity-60"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        rule.enabled ? "bg-primary/10" : "bg-muted"
                    )}>
                        <TypeIcon size={18} className={rule.enabled ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium">{rule.name}</h4>
                            <SeverityBadge severity={rule.severity} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {rule.timeWindow}s window
                            </span>
                            <span>{typeLabels[rule.type]}</span>
                            {rule.threshold && (
                                <span>Threshold: {rule.threshold}</span>
                            )}
                            {alertCount > 0 && (
                                <span className="text-amber-500">{alertCount} alerts</span>
                            )}
                        </div>
                        {rule.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                                {rule.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggle}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            rule.enabled
                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                        title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                        {rule.enabled ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} className="text-destructive" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SeverityBadge({ severity }: { severity: string }) {
    const colors: Record<string, string> = {
        critical: 'bg-red-500/10 text-red-500',
        high: 'bg-orange-500/10 text-orange-500',
        medium: 'bg-amber-500/10 text-amber-500',
        low: 'bg-blue-500/10 text-blue-500',
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
            colors[severity] || 'bg-muted text-muted-foreground'
        )}>
            {severity}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
        new: { color: 'bg-blue-500/10 text-blue-500', icon: <AlertTriangle size={10} /> },
        acknowledged: { color: 'bg-amber-500/10 text-amber-500', icon: <Clock size={10} /> },
        resolved: { color: 'bg-emerald-500/10 text-emerald-500', icon: <CheckCircle size={10} /> },
        suppressed: { color: 'bg-muted text-muted-foreground', icon: <XCircle size={10} /> },
    };

    const { color, icon } = config[status] || config.new;

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize", color)}>
            {icon}
            {status}
        </span>
    );
}

function CreateRuleModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (rule: CorrelationRule) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<CorrelationType>('threshold');
    const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
    const [timeWindow, setTimeWindow] = useState('300');
    const [threshold, setThreshold] = useState('5');

    const handleSubmit = () => {
        if (!name.trim()) return;

        const rule: CorrelationRule = {
            id: `rule-${Date.now()}`,
            name,
            description,
            enabled: true,
            type,
            severity,
            conditions: [],
            timeWindow: parseInt(timeWindow),
            threshold: parseInt(threshold),
            groupBy: [],
            actions: [{ type: 'alert', config: {} }],
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        onCreate(rule);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create Correlation Rule" size="md">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Rule Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Brute Force Detection"
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this rule detects..."
                        rows={2}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Correlation Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as CorrelationType)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                        >
                            {Object.entries(typeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Severity</label>
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as typeof severity)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                        >
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Time Window (seconds)</label>
                        <input
                            type="number"
                            value={timeWindow}
                            onChange={(e) => setTimeWindow(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Threshold</label>
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
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
                        disabled={!name.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                        Create Rule
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default CorrelationRulesManager;
