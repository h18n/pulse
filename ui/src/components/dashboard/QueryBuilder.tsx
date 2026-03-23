'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Play, X, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common metric suggestions
const METRIC_SUGGESTIONS = [
    { label: 'CPU Usage', expr: 'avg(node_cpu_seconds_total{mode="idle"})', category: 'System' },
    { label: 'Memory Usage', expr: 'node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes', category: 'System' },
    { label: 'Disk Usage', expr: 'node_filesystem_size_bytes - node_filesystem_free_bytes', category: 'System' },
    { label: 'HTTP Request Rate', expr: 'rate(http_requests_total[5m])', category: 'Application' },
    { label: 'HTTP Error Rate', expr: 'rate(http_requests_total{status=~"5.."}[5m])', category: 'Application' },
    { label: 'Response Latency P99', expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))', category: 'Application' },
    { label: 'Active Connections', expr: 'nginx_connections_active', category: 'Network' },
    { label: 'Bytes Sent', expr: 'rate(node_network_transmit_bytes_total[5m])', category: 'Network' },
    { label: 'Bytes Received', expr: 'rate(node_network_receive_bytes_total[5m])', category: 'Network' },
    { label: 'Container CPU', expr: 'rate(container_cpu_usage_seconds_total[5m])', category: 'Container' },
    { label: 'Container Memory', expr: 'container_memory_usage_bytes', category: 'Container' },
    { label: 'Pod Count', expr: 'count(kube_pod_info)', category: 'Kubernetes' },
];

// Common label suggestions
const LABEL_SUGGESTIONS = [
    'instance', 'job', 'host', 'env', 'region', 'service', 'method', 'status', 'pod', 'namespace'
];

// Aggregation functions
const AGGREGATIONS = [
    { value: '', label: 'None' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'count', label: 'Count' },
    { value: 'stddev', label: 'Std Deviation' },
    { value: 'rate', label: 'Rate' },
];

// Time ranges
const TIME_RANGES = [
    { value: '1m', label: '1 minute' },
    { value: '5m', label: '5 minutes' },
    { value: '15m', label: '15 minutes' },
    { value: '30m', label: '30 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '6h', label: '6 hours' },
    { value: '24h', label: '24 hours' },
];

interface LabelFilter {
    key: string;
    operator: '=' | '!=' | '=~' | '!~';
    value: string;
}

interface QueryBuilderState {
    metric: string;
    labelFilters: LabelFilter[];
    aggregation: string;
    aggregationBy: string[];
    rateRange: string;
    useRate: boolean;
}

interface QueryBuilderProps {
    value: string;
    onChange: (query: string) => void;
    onValidate?: (isValid: boolean) => void;
    className?: string;
}

export function QueryBuilder({ value, onChange, onValidate, className }: QueryBuilderProps) {
    const [mode, setMode] = useState<'builder' | 'raw'>('builder');
    const [rawQuery, setRawQuery] = useState(value);
    const [showMetricDropdown, setShowMetricDropdown] = useState(false);
    const [metricSearch, setMetricSearch] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);

    const [builderState, setBuilderState] = useState<QueryBuilderState>({
        metric: '',
        labelFilters: [],
        aggregation: '',
        aggregationBy: [],
        rateRange: '5m',
        useRate: false,
    });

    // Build query from state
    const buildQuery = (state: QueryBuilderState): string => {
        if (!state.metric) return '';

        let query = state.metric;

        // Add label filters
        if (state.labelFilters.length > 0) {
            const filterStr = state.labelFilters
                .filter(f => f.key && f.value)
                .map(f => `${f.key}${f.operator}"${f.value}"`)
                .join(', ');
            if (filterStr) {
                query = `${query}{${filterStr}}`;
            }
        }

        // Add rate if enabled
        if (state.useRate && state.rateRange) {
            query = `rate(${query}[${state.rateRange}])`;
        }

        // Add aggregation
        if (state.aggregation) {
            if (state.aggregationBy.length > 0) {
                query = `${state.aggregation} by (${state.aggregationBy.join(', ')}) (${query})`;
            } else {
                query = `${state.aggregation}(${query})`;
            }
        }

        return query;
    };

    // Update query when builder state changes
    useEffect(() => {
        if (mode === 'builder') {
            const newQuery = buildQuery(builderState);
            setRawQuery(newQuery);
            onChange(newQuery);
        }
    }, [builderState, mode, onChange]);

    // Handle raw query change
    const handleRawQueryChange = (newValue: string) => {
        setRawQuery(newValue);
        onChange(newValue);
        setValidationResult(null);
    };

    // Validate query (mock)
    const validateQuery = async () => {
        setIsValidating(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const isValid = rawQuery.length > 0 && !rawQuery.includes('ERROR');
        setValidationResult({
            valid: isValid,
            message: isValid ? 'Query is valid' : 'Invalid query syntax'
        });
        setIsValidating(false);
        onValidate?.(isValid);
    };

    // Add label filter
    const addLabelFilter = () => {
        setBuilderState(prev => ({
            ...prev,
            labelFilters: [...prev.labelFilters, { key: '', operator: '=', value: '' }]
        }));
    };

    // Update label filter
    const updateLabelFilter = (index: number, updates: Partial<LabelFilter>) => {
        setBuilderState(prev => ({
            ...prev,
            labelFilters: prev.labelFilters.map((f, i) =>
                i === index ? { ...f, ...updates } : f
            )
        }));
    };

    // Remove label filter
    const removeLabelFilter = (index: number) => {
        setBuilderState(prev => ({
            ...prev,
            labelFilters: prev.labelFilters.filter((_, i) => i !== index)
        }));
    };

    // Select metric from suggestions
    const selectMetric = (expr: string) => {
        setBuilderState(prev => ({ ...prev, metric: expr }));
        setShowMetricDropdown(false);
        setMetricSearch('');
    };

    // Filter metric suggestions
    const filteredMetrics = METRIC_SUGGESTIONS.filter(m =>
        m.label.toLowerCase().includes(metricSearch.toLowerCase()) ||
        m.expr.toLowerCase().includes(metricSearch.toLowerCase())
    );

    // Group metrics by category
    const groupedMetrics = filteredMetrics.reduce((acc, m) => {
        if (!acc[m.category]) acc[m.category] = [];
        acc[m.category].push(m);
        return acc;
    }, {} as Record<string, typeof METRIC_SUGGESTIONS>);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setMode('builder')}
                    className={cn(
                        "px-3 py-1.5 text-sm rounded-lg transition-colors",
                        mode === 'builder'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    Builder
                </button>
                <button
                    onClick={() => setMode('raw')}
                    className={cn(
                        "px-3 py-1.5 text-sm rounded-lg transition-colors",
                        mode === 'raw'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    Raw Query
                </button>
            </div>

            {mode === 'builder' ? (
                <div className="space-y-4">
                    {/* Metric Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Metric</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={metricSearch || builderState.metric}
                                onChange={(e) => {
                                    setMetricSearch(e.target.value);
                                    setBuilderState(prev => ({ ...prev, metric: e.target.value }));
                                    setShowMetricDropdown(true);
                                }}
                                onFocus={() => setShowMetricDropdown(true)}
                                placeholder="Select or type a metric..."
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <ChevronDown
                                size={16}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />

                            {/* Metric Dropdown */}
                            {showMetricDropdown && (
                                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
                                    {Object.entries(groupedMetrics).map(([category, metrics]) => (
                                        <div key={category}>
                                            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                                {category}
                                            </div>
                                            {metrics.map((m) => (
                                                <button
                                                    key={m.expr}
                                                    onClick={() => selectMetric(m.expr)}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                                                >
                                                    <div className="font-medium">{m.label}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{m.expr}</div>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                    {filteredMetrics.length === 0 && (
                                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                            No metrics found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Label Filters */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Label Filters</label>
                            <button
                                onClick={addLabelFilter}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <Plus size={12} /> Add filter
                            </button>
                        </div>
                        {builderState.labelFilters.map((filter, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <select
                                    value={filter.key}
                                    onChange={(e) => updateLabelFilter(index, { key: e.target.value })}
                                    className="flex-1 px-2 py-1.5 bg-muted border border-border rounded text-sm"
                                >
                                    <option value="">Select label...</option>
                                    {LABEL_SUGGESTIONS.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <select
                                    value={filter.operator}
                                    onChange={(e) => updateLabelFilter(index, { operator: e.target.value as LabelFilter['operator'] })}
                                    className="w-16 px-2 py-1.5 bg-muted border border-border rounded text-sm"
                                >
                                    <option value="=">=</option>
                                    <option value="!=">!=</option>
                                    <option value="=~">=~</option>
                                    <option value="!~">!~</option>
                                </select>
                                <input
                                    type="text"
                                    value={filter.value}
                                    onChange={(e) => updateLabelFilter(index, { value: e.target.value })}
                                    placeholder="Value"
                                    className="flex-1 px-2 py-1.5 bg-muted border border-border rounded text-sm"
                                />
                                <button
                                    onClick={() => removeLabelFilter(index)}
                                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Rate Toggle */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={builderState.useRate}
                                onChange={(e) => setBuilderState(prev => ({ ...prev, useRate: e.target.checked }))}
                                className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">Apply rate()</span>
                        </label>
                        {builderState.useRate && (
                            <select
                                value={builderState.rateRange}
                                onChange={(e) => setBuilderState(prev => ({ ...prev, rateRange: e.target.value }))}
                                className="px-2 py-1 bg-muted border border-border rounded text-sm"
                            >
                                {TIME_RANGES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Aggregation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Aggregation</label>
                            <select
                                value={builderState.aggregation}
                                onChange={(e) => setBuilderState(prev => ({ ...prev, aggregation: e.target.value }))}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                            >
                                {AGGREGATIONS.map(a => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                        </div>
                        {builderState.aggregation && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Group by</label>
                                <select
                                    multiple
                                    value={builderState.aggregationBy}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions, opt => opt.value);
                                        setBuilderState(prev => ({ ...prev, aggregationBy: values }));
                                    }}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm h-20"
                                >
                                    {LABEL_SUGGESTIONS.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <label className="text-sm font-medium">PromQL Query</label>
                    <textarea
                        value={rawQuery}
                        onChange={(e) => handleRawQueryChange(e.target.value)}
                        placeholder="Enter your PromQL query..."
                        rows={4}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                </div>
            )}

            {/* Generated Query Preview */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Query Preview</label>
                <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto">
                        {rawQuery || 'No query defined'}
                    </code>
                    <button
                        onClick={validateQuery}
                        disabled={!rawQuery || isValidating}
                        className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                        {isValidating ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Play size={14} />
                        )}
                        Test
                    </button>
                </div>

                {/* Validation Result */}
                {validationResult && (
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        validationResult.valid
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-destructive/10 text-destructive"
                    )}>
                        {validationResult.valid ? <Check size={14} /> : <AlertCircle size={14} />}
                        {validationResult.message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QueryBuilder;
