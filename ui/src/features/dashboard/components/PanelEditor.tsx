"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Play,
    Code,
    Settings,
    Database,
    Palette,
    AlertCircle,
    ChevronDown,
    Plus,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Panel, useDashboardStore } from '@/stores/dashboardStore';
import { getAllWidgets, getWidget } from '../widgets/registry';

interface PanelEditorProps {
    panel: Panel;
    onClose: () => void;
}

type TabId = 'query' | 'options' | 'fieldConfig' | 'overrides';

export function PanelEditor({ panel, onClose }: PanelEditorProps) {
    const [activeTab, setActiveTab] = useState<TabId>('query');
    const [editedPanel, setEditedPanel] = useState<Panel>({ ...panel });
    const [showTypeSelector, setShowTypeSelector] = useState(false);

    const { updatePanel, exitEditMode } = useDashboardStore();
    const widgets = getAllWidgets();
    const currentWidget = getWidget(editedPanel.type);

    const handleSave = () => {
        updatePanel(editedPanel.id, editedPanel);
        exitEditMode();
        onClose();
    };

    const handleCancel = () => {
        exitEditMode();
        onClose();
    };

    const updateTitle = (title: string) => {
        setEditedPanel(prev => ({ ...prev, title }));
    };

    const updateType = (type: string) => {
        setEditedPanel(prev => ({ ...prev, type: type as any }));
        setShowTypeSelector(false);
    };

    const updateTarget = (index: number, updates: Partial<typeof editedPanel.targets[0]>) => {
        setEditedPanel(prev => ({
            ...prev,
            targets: prev.targets.map((t, i) => i === index ? { ...t, ...updates } : t),
        }));
    };

    const addTarget = () => {
        const nextRefId = String.fromCharCode(65 + editedPanel.targets.length);
        setEditedPanel(prev => ({
            ...prev,
            targets: [...prev.targets, { refId: nextRefId, expr: '' }],
        }));
    };

    const removeTarget = (index: number) => {
        setEditedPanel(prev => ({
            ...prev,
            targets: prev.targets.filter((_, i) => i !== index),
        }));
    };

    const updateOption = (key: string, value: any) => {
        setEditedPanel(prev => ({
            ...prev,
            options: { ...prev.options, [key]: value },
        }));
    };

    const updateFieldConfig = (key: string, value: any) => {
        setEditedPanel(prev => ({
            ...prev,
            fieldConfig: {
                defaults: { ...prev.fieldConfig?.defaults, [key]: value },
                overrides: prev.fieldConfig?.overrides || [],
            },
        }));
    };

    const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
        { id: 'query', label: 'Query', icon: <Database size={16} /> },
        { id: 'options', label: 'Panel Options', icon: <Settings size={16} /> },
        { id: 'fieldConfig', label: 'Field Config', icon: <Palette size={16} /> },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />

            {/* Editor Panel */}
            <div className="relative flex flex-col w-full max-w-4xl mx-auto my-8 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold">Edit Panel</h2>
                        <div className="relative">
                            <button
                                onClick={() => setShowTypeSelector(!showTypeSelector)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                            >
                                {currentWidget?.name || editedPanel.type}
                                <ChevronDown size={14} />
                            </button>
                            {showTypeSelector && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-xl z-10 py-1">
                                    {widgets.map(w => (
                                        <button
                                            key={w.id}
                                            onClick={() => updateType(w.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                                                w.id === editedPanel.type && "bg-primary/10 text-primary"
                                            )}
                                        >
                                            {w.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            <Save size={16} />
                            Apply
                        </button>
                    </div>
                </div>

                {/* Title Input */}
                <div className="px-6 py-3 border-b border-border">
                    <label className="block text-xs text-muted-foreground mb-1">Panel Title</label>
                    <input
                        type="text"
                        value={editedPanel.title}
                        onChange={(e) => updateTitle(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        placeholder="Enter panel title..."
                    />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'query' && (
                        <QueryEditor
                            targets={editedPanel.targets}
                            onUpdateTarget={updateTarget}
                            onAddTarget={addTarget}
                            onRemoveTarget={removeTarget}
                            panelType={editedPanel.type}
                        />
                    )}

                    {activeTab === 'options' && (
                        <OptionsEditor
                            options={editedPanel.options || {}}
                            panelType={editedPanel.type}
                            onUpdate={updateOption}
                        />
                    )}

                    {activeTab === 'fieldConfig' && (
                        <FieldConfigEditor
                            fieldConfig={editedPanel.fieldConfig?.defaults || {}}
                            onUpdate={updateFieldConfig}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============== Query Editor ==============

interface QueryEditorProps {
    targets: Panel['targets'];
    onUpdateTarget: (index: number, updates: Partial<Panel['targets'][0]>) => void;
    onAddTarget: () => void;
    onRemoveTarget: (index: number) => void;
    panelType: string;
}

function QueryEditor({ targets, onUpdateTarget, onAddTarget, onRemoveTarget, panelType }: QueryEditorProps) {
    const isPrometheus = ['timeseries', 'stat', 'gauge'].includes(panelType);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium">Data Queries</h3>
                <button
                    onClick={onAddTarget}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <Plus size={14} />
                    Add query
                </button>
            </div>

            {targets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No queries defined. Add a query to fetch data.</p>
                </div>
            )}

            {targets.map((target, idx) => (
                <div key={idx} className="p-4 bg-muted/30 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary/10 text-primary rounded text-xs font-bold flex items-center justify-center">
                                {target.refId}
                            </span>
                            <span className="text-sm font-medium">Query {target.refId}</span>
                        </div>
                        {targets.length > 1 && (
                            <button
                                onClick={() => onRemoveTarget(idx)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {isPrometheus ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">PromQL Expression</label>
                                <textarea
                                    value={target.expr || ''}
                                    onChange={(e) => onUpdateTarget(idx, { expr: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="e.g., rate(http_requests_total[5m])"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Legend Format</label>
                                <input
                                    type="text"
                                    value={target.legendFormat || ''}
                                    onChange={(e) => onUpdateTarget(idx, { legendFormat: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                                    placeholder="e.g., {{instance}}"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Query</label>
                            <textarea
                                value={target.query || ''}
                                onChange={(e) => onUpdateTarget(idx, { query: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none resize-none"
                                rows={3}
                                placeholder="Enter query..."
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ============== Options Editor ==============

interface OptionsEditorProps {
    options: Record<string, any>;
    panelType: string;
    onUpdate: (key: string, value: any) => void;
}

function OptionsEditor({ options, panelType, onUpdate }: OptionsEditorProps) {
    const optionFields = getOptionsForPanelType(panelType);

    return (
        <div className="space-y-4">
            <h3 className="font-medium">Panel Options</h3>

            <div className="grid grid-cols-2 gap-4">
                {optionFields.map(field => (
                    <div key={field.key}>
                        <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                value={options[field.key] ?? field.default}
                                onChange={(e) => onUpdate(field.key, e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                            >
                                {field.options?.map((opt: { value: string; label: string }) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : field.type === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options[field.key] ?? field.default}
                                    onChange={(e) => onUpdate(field.key, e.target.checked)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm">{field.label}</span>
                            </label>
                        ) : (
                            <input
                                type={field.type}
                                value={options[field.key] ?? field.default ?? ''}
                                onChange={(e) => onUpdate(field.key, e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getOptionsForPanelType(panelType: string) {
    const commonOptions: Array<{ key: string; label: string; type: string; default?: unknown; options?: Array<{ value: string; label: string }> }> = [];

    switch (panelType) {
        case 'timeseries':
            return [
                { key: 'legend.showLegend', label: 'Show Legend', type: 'boolean', default: true },
                {
                    key: 'legend.placement', label: 'Legend Position', type: 'select', default: 'bottom', options: [
                        { value: 'bottom', label: 'Bottom' },
                        { value: 'right', label: 'Right' },
                    ]
                },
                {
                    key: 'tooltip.mode', label: 'Tooltip Mode', type: 'select', default: 'single', options: [
                        { value: 'single', label: 'Single' },
                        { value: 'multi', label: 'All' },
                    ]
                },
            ];
        case 'stat':
            return [
                {
                    key: 'colorMode', label: 'Color Mode', type: 'select', default: 'value', options: [
                        { value: 'value', label: 'Value' },
                        { value: 'background', label: 'Background' },
                    ]
                },
                {
                    key: 'graphMode', label: 'Graph Mode', type: 'select', default: 'area', options: [
                        { value: 'area', label: 'Area' },
                        { value: 'none', label: 'None' },
                    ]
                },
            ];
        case 'gauge':
            return [
                { key: 'showThresholdLabels', label: 'Show Threshold Labels', type: 'boolean', default: false },
                { key: 'showThresholdMarkers', label: 'Show Threshold Markers', type: 'boolean', default: true },
            ];
        case 'barchart':
            return [
                {
                    key: 'orientation', label: 'Orientation', type: 'select', default: 'vertical', options: [
                        { value: 'vertical', label: 'Vertical' },
                        { value: 'horizontal', label: 'Horizontal' },
                    ]
                },
                { key: 'showValue', label: 'Show Value', type: 'boolean', default: true },
            ];
        case 'table':
            return [
                { key: 'showHeader', label: 'Show Header', type: 'boolean', default: true },
                {
                    key: 'cellHeight', label: 'Cell Height', type: 'select', default: 'sm', options: [
                        { value: 'xs', label: 'Extra Small' },
                        { value: 'sm', label: 'Small' },
                        { value: 'md', label: 'Medium' },
                        { value: 'lg', label: 'Large' },
                    ]
                },
            ];
        case 'statusgrid':
            return [
                { key: 'columns', label: 'Columns', type: 'number', default: 4 },
                { key: 'showLabels', label: 'Show Labels', type: 'boolean', default: false },
            ];
        default:
            return commonOptions;
    }
}

// ============== Field Config Editor ==============

interface FieldConfigEditorProps {
    fieldConfig: Record<string, any>;
    onUpdate: (key: string, value: any) => void;
}

function FieldConfigEditor({ fieldConfig, onUpdate }: FieldConfigEditorProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-medium mb-4">Standard Options</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Unit</label>
                        <select
                            value={fieldConfig.unit || ''}
                            onChange={(e) => onUpdate('unit', e.target.value)}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        >
                            <option value="">None</option>
                            <option value="short">Short</option>
                            <option value="percent">Percent (0-100)</option>
                            <option value="percentunit">Percent (0.0-1.0)</option>
                            <option value="ms">Milliseconds (ms)</option>
                            <option value="s">Seconds (s)</option>
                            <option value="bytes">Bytes</option>
                            <option value="decbytes">Bytes (SI)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Decimals</label>
                        <input
                            type="number"
                            value={fieldConfig.decimals ?? ''}
                            onChange={(e) => onUpdate('decimals', parseInt(e.target.value) || 0)}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                            min={0}
                            max={10}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Min</label>
                        <input
                            type="number"
                            value={fieldConfig.min ?? ''}
                            onChange={(e) => onUpdate('min', parseFloat(e.target.value))}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Max</label>
                        <input
                            type="number"
                            value={fieldConfig.max ?? ''}
                            onChange={(e) => onUpdate('max', parseFloat(e.target.value))}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="font-medium mb-4">Thresholds</h3>
                <ThresholdEditor
                    thresholds={fieldConfig.thresholds?.steps || []}
                    onUpdate={(steps) => onUpdate('thresholds', { mode: 'absolute', steps })}
                />
            </div>
        </div>
    );
}

// ============== Threshold Editor ==============

interface ThresholdEditorProps {
    thresholds: Array<{ value: number; color: string }>;
    onUpdate: (thresholds: Array<{ value: number; color: string }>) => void;
}

function ThresholdEditor({ thresholds, onUpdate }: ThresholdEditorProps) {
    const colors = [
        { value: 'green', label: 'Green', hex: '#10b981' },
        { value: 'yellow', label: 'Yellow', hex: '#f59e0b' },
        { value: 'orange', label: 'Orange', hex: '#f97316' },
        { value: 'red', label: 'Red', hex: '#ef4444' },
    ];

    const addThreshold = () => {
        const lastValue = thresholds.length > 0 ? thresholds[thresholds.length - 1].value : 0;
        onUpdate([...thresholds, { value: lastValue + 10, color: 'yellow' }]);
    };

    const updateThreshold = (index: number, updates: Partial<{ value: number; color: string }>) => {
        const newThresholds = thresholds.map((t, i) => i === index ? { ...t, ...updates } : t);
        onUpdate(newThresholds);
    };

    const removeThreshold = (index: number) => {
        onUpdate(thresholds.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            {thresholds.map((threshold, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colors.find(c => c.value === threshold.color)?.hex || threshold.color }}
                    />
                    <select
                        value={threshold.color}
                        onChange={(e) => updateThreshold(idx, { color: e.target.value })}
                        className="bg-muted border border-border rounded px-2 py-1 text-sm"
                    >
                        {colors.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={threshold.value}
                        onChange={(e) => updateThreshold(idx, { value: parseFloat(e.target.value) || 0 })}
                        className="flex-1 bg-muted border border-border rounded px-2 py-1 text-sm"
                    />
                    <button
                        onClick={() => removeThreshold(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button
                onClick={addThreshold}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
                <Plus size={14} />
                Add threshold
            </button>
        </div>
    );
}

export default PanelEditor;
