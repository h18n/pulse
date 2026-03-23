'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Play,
    Pause,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    Settings,
    Trash2,
    RefreshCw,
    GitBranch,
    Terminal,
    Globe,
    Bell,
    Timer,
    ShieldCheck,
    History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { getRunbookEngine, Runbook, RunbookExecution, StepExecution } from '@/lib/runbook';

const stepTypeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    command: Terminal,
    script: Terminal,
    api_call: Globe,
    condition: GitBranch,
    approval: ShieldCheck,
    notification: Bell,
    wait: Timer,
};

export function RunbookManager() {
    const [runbooks, setRunbooks] = useState<Runbook[]>([]);
    const [executions, setExecutions] = useState<RunbookExecution[]>([]);
    const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
    const [selectedExecution, setSelectedExecution] = useState<RunbookExecution | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'runbooks' | 'executions'>('runbooks');

    const engine = getRunbookEngine();

    useEffect(() => {
        // Load runbooks and executions
        setRunbooks(engine.getRunbooks());
        setExecutions(engine.getExecutions());

        // Listen for updates
        const handleExecution = () => {
            setExecutions(engine.getExecutions());
        };

        engine.on('executionStarted', handleExecution);
        engine.on('executionCompleted', handleExecution);
        engine.on('executionFailed', handleExecution);
        engine.on('stepCompleted', handleExecution);

        return () => {
            engine.off('executionStarted', handleExecution);
            engine.off('executionCompleted', handleExecution);
            engine.off('executionFailed', handleExecution);
            engine.off('stepCompleted', handleExecution);
        };
    }, []);

    // Filter runbooks
    const filteredRunbooks = runbooks.filter(rb =>
        rb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rb.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const stats = {
        total: runbooks.length,
        enabled: runbooks.filter(r => r.enabled).length,
        executions: executions.length,
        failed: executions.filter(e => e.status === 'failed').length,
    };

    const handleExecuteRunbook = async (runbookId: string) => {
        try {
            await engine.executeRunbook(runbookId, 'current-user', 'manual');
            setExecutions(engine.getExecutions());
        } catch (error) {
            console.error('Execution failed:', error);
        }
    };

    const handleToggleRunbook = (runbookId: string) => {
        const runbook = runbooks.find(r => r.id === runbookId);
        if (runbook) {
            engine.updateRunbook(runbookId, { enabled: !runbook.enabled });
            setRunbooks(engine.getRunbooks());
        }
    };

    const handleDeleteRunbook = () => {
        if (selectedRunbook) {
            engine.unregisterRunbook(selectedRunbook.id);
            setRunbooks(engine.getRunbooks());
            setSelectedRunbook(null);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                        <BookOpen size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Runbook Automation</h1>
                        <p className="text-sm text-muted-foreground">
                            Automate incident response workflows
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                    <Plus size={16} />
                    Create Runbook
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard icon={<BookOpen size={18} />} label="Total Runbooks" value={stats.total} color="indigo" />
                <StatCard icon={<CheckCircle size={18} />} label="Enabled" value={stats.enabled} color="emerald" />
                <StatCard icon={<History size={18} />} label="Executions" value={stats.executions} color="blue" />
                <StatCard icon={<XCircle size={18} />} label="Failed" value={stats.failed} color="red" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('runbooks')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'runbooks'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Runbooks
                </button>
                <button
                    onClick={() => setActiveTab('executions')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'executions'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Execution History
                </button>
            </div>

            {/* Search */}
            {activeTab === 'runbooks' && (
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search runbooks..."
                        className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            )}

            {/* Content */}
            {activeTab === 'runbooks' ? (
                <div className="space-y-3">
                    {filteredRunbooks.length === 0 ? (
                        <EmptyState
                            icon={<BookOpen size={40} />}
                            title="No runbooks found"
                            description="Create your first runbook to automate incident response"
                        />
                    ) : (
                        filteredRunbooks.map(runbook => (
                            <RunbookCard
                                key={runbook.id}
                                runbook={runbook}
                                executionCount={executions.filter(e => e.runbookId === runbook.id).length}
                                onExecute={() => handleExecuteRunbook(runbook.id)}
                                onToggle={() => handleToggleRunbook(runbook.id)}
                                onView={() => setSelectedRunbook(runbook)}
                                onDelete={() => { setSelectedRunbook(runbook); setShowDeleteConfirm(true); }}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {executions.length === 0 ? (
                        <EmptyState
                            icon={<History size={40} />}
                            title="No executions yet"
                            description="Run a runbook to see execution history"
                        />
                    ) : (
                        <div className="border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">Runbook</th>
                                        <th className="text-left px-4 py-3 font-medium">Started</th>
                                        <th className="text-left px-4 py-3 font-medium">Duration</th>
                                        <th className="text-left px-4 py-3 font-medium">Trigger</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {executions.slice(0, 20).map(execution => (
                                        <tr key={execution.id} className="border-t border-border hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{execution.runbookName}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(execution.startTime).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {execution.endTime
                                                    ? `${((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000).toFixed(1)}s`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-4 py-3 capitalize">{execution.triggerType}</td>
                                            <td className="px-4 py-3">
                                                <ExecutionStatusBadge status={execution.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setSelectedExecution(execution)}
                                                    className="text-primary hover:underline text-xs"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Runbook Detail Modal */}
            {selectedRunbook && !showDeleteConfirm && (
                <RunbookDetailModal
                    runbook={selectedRunbook}
                    onClose={() => setSelectedRunbook(null)}
                    onExecute={() => handleExecuteRunbook(selectedRunbook.id)}
                />
            )}

            {/* Execution Detail Modal */}
            {selectedExecution && (
                <ExecutionDetailModal
                    execution={selectedExecution}
                    onClose={() => setSelectedExecution(null)}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setSelectedRunbook(null); }}
                onConfirm={handleDeleteRunbook}
                title="Delete Runbook"
                description={`Are you sure you want to delete "${selectedRunbook?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
            />

            {/* Create Modal */}
            {showCreateModal && (
                <CreateRunbookModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={(runbook) => {
                        engine.registerRunbook(runbook);
                        setRunbooks(engine.getRunbooks());
                        setShowCreateModal(false);
                    }}
                />
            )}
        </div>
    );
}

// ============== Sub-components ==============

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'indigo' | 'emerald' | 'blue' | 'red';
}) {
    const colors = {
        indigo: 'bg-indigo-500/10 text-indigo-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        blue: 'bg-blue-500/10 text-blue-500',
        red: 'bg-red-500/10 text-red-500',
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

function EmptyState({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl">
            <div className="text-muted-foreground mb-3 opacity-50">{icon}</div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );
}

function RunbookCard({ runbook, executionCount, onExecute, onToggle, onView, onDelete }: {
    runbook: Runbook;
    executionCount: number;
    onExecute: () => void;
    onToggle: () => void;
    onView: () => void;
    onDelete: () => void;
}) {
    return (
        <div className={cn(
            "p-4 bg-card border rounded-xl transition-all",
            runbook.enabled ? "border-border" : "border-border opacity-60"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        runbook.enabled ? "bg-indigo-500/10" : "bg-muted"
                    )}>
                        <BookOpen size={18} className={runbook.enabled ? "text-indigo-500" : "text-muted-foreground"} />
                    </div>
                    <div>
                        <h4 className="font-medium">{runbook.name}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{runbook.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <GitBranch size={12} />
                                {runbook.steps.length} steps
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {runbook.timeout}s timeout
                            </span>
                            <span className="flex items-center gap-1">
                                <History size={12} />
                                {executionCount} runs
                            </span>
                        </div>
                        {runbook.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                                {runbook.tags.slice(0, 3).map(tag => (
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
                        onClick={onExecute}
                        disabled={!runbook.enabled}
                        aria-label="Run playbook"
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:opacity-90 disabled:opacity-50"
                    >
                        <Play size={12} />
                        Run
                    </button>
                    <button
                        onClick={onToggle}
                        aria-label={runbook.enabled ? "Disable runbook" : "Enable runbook"}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            runbook.enabled
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {runbook.enabled ? <CheckCircle size={14} /> : <Pause size={14} />}
                    </button>
                    <button onClick={onView} className="p-2 hover:bg-muted rounded-lg">
                        <Settings size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={onDelete} className="p-2 hover:bg-destructive/10 rounded-lg">
                        <Trash2 size={14} className="text-destructive" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ExecutionStatusBadge({ status }: { status: RunbookExecution['status'] }) {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
        pending: { color: 'bg-muted text-muted-foreground', icon: <Clock size={10} /> },
        running: { color: 'bg-blue-500/10 text-blue-500', icon: <RefreshCw size={10} className="animate-spin" /> },
        completed: { color: 'bg-emerald-500/10 text-emerald-500', icon: <CheckCircle size={10} /> },
        failed: { color: 'bg-red-500/10 text-red-500', icon: <XCircle size={10} /> },
        cancelled: { color: 'bg-muted text-muted-foreground', icon: <XCircle size={10} /> },
        waiting_approval: { color: 'bg-amber-500/10 text-amber-500', icon: <AlertCircle size={10} /> },
    };

    const { color, icon } = config[status] || config.pending;

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize", color)}>
            {icon}
            {status.replace('_', ' ')}
        </span>
    );
}

function RunbookDetailModal({ runbook, onClose, onExecute }: {
    runbook: Runbook;
    onClose: () => void;
    onExecute: () => void;
}) {
    return (
        <Modal isOpen={true} onClose={onClose} title={runbook.name} size="lg">
            <div className="p-6 space-y-6">
                <p className="text-sm text-muted-foreground">{runbook.description}</p>

                {/* Steps */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Steps ({runbook.steps.length})</h4>
                    <div className="space-y-2">
                        {runbook.steps.map((step, idx) => {
                            const Icon = stepTypeIcons[(step.config as { type: string }).type] || Terminal;
                            return (
                                <div key={step.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <span className="w-6 h-6 bg-primary/10 text-primary rounded flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </span>
                                    <Icon size={16} className="text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{step.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {(step.config as { type: string }).type.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        On failure: {step.onFailure}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                        Close
                    </button>
                    <button
                        onClick={() => { onExecute(); onClose(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                    >
                        <Play size={14} />
                        Execute
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function ExecutionDetailModal({ execution, onClose }: {
    execution: RunbookExecution;
    onClose: () => void;
}) {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Execution: ${execution.runbookName}`} size="lg">
            <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="flex items-center gap-4">
                    <ExecutionStatusBadge status={execution.status} />
                    <span className="text-sm text-muted-foreground">
                        Started: {new Date(execution.startTime).toLocaleString()}
                    </span>
                    {execution.endTime && (
                        <span className="text-sm text-muted-foreground">
                            Duration: {((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000).toFixed(1)}s
                        </span>
                    )}
                </div>

                {execution.error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {execution.error}
                    </div>
                )}

                {/* Steps */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Step Executions</h4>
                    <div className="space-y-2">
                        {execution.steps.map((step, idx) => (
                            <div key={step.stepId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                <span className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{step.stepName}</p>
                                    {step.error && (
                                        <p className="text-xs text-destructive">{step.error}</p>
                                    )}
                                </div>
                                <StepStatusBadge status={step.status} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function StepStatusBadge({ status }: { status: StepExecution['status'] }) {
    const colors: Record<string, string> = {
        pending: 'bg-muted text-muted-foreground',
        running: 'bg-blue-500/10 text-blue-500',
        completed: 'bg-emerald-500/10 text-emerald-500',
        failed: 'bg-red-500/10 text-red-500',
        skipped: 'bg-muted text-muted-foreground',
        waiting: 'bg-amber-500/10 text-amber-500',
    };

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", colors[status])}>
            {status}
        </span>
    );
}

function CreateRunbookModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (runbook: Runbook) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;

        const runbook: Runbook = {
            id: `rb-${Date.now()}`,
            name,
            description,
            version: '1.0.0',
            enabled: true,
            triggers: [{ type: 'manual', config: {} }],
            steps: [],
            timeout: 300,
            retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelay: 5 },
            notifications: [],
            tags: [],
            owner: 'current-user',
            lastModified: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };

        onCreate(runbook);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create Runbook" size="sm">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Incident Response Playbook"
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the runbook purpose..."
                        rows={3}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                        Create
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default RunbookManager;
