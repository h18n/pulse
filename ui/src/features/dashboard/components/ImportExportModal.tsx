"use client";

import React, { useState, useRef } from 'react';
import {
    X,
    Download,
    Upload,
    Copy,
    Check,
    FileJson,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dashboard, useDashboardStore } from '@/stores/dashboardStore';

interface ImportExportModalProps {
    mode: 'import' | 'export';
    onClose: () => void;
}

export function ImportExportModal({ mode, onClose }: ImportExportModalProps) {
    const [jsonContent, setJsonContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { currentDashboard: dashboard, loadDashboard } = useDashboardStore();

    // Export: Generate JSON from current dashboard
    React.useEffect(() => {
        if (mode === 'export' && dashboard) {
            const exportData = {
                ...dashboard,
                __export_timestamp: new Date().toISOString(),
                __export_version: '1.0',
            };
            setJsonContent(JSON.stringify(exportData, null, 2));
        }
    }, [mode, dashboard]);

    const handleImport = () => {
        setError(null);
        try {
            const parsed = JSON.parse(jsonContent);

            // Validate basic structure
            if (!parsed.title) {
                throw new Error('Invalid dashboard: missing title');
            }
            if (!Array.isArray(parsed.panels)) {
                throw new Error('Invalid dashboard: panels must be an array');
            }

            // Clean up export metadata
            delete parsed.__export_timestamp;
            delete parsed.__export_version;

            // Generate new UID to avoid conflicts
            parsed.uid = `imported-${Date.now()}`;

            loadDashboard(parsed as Dashboard);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setJsonContent(content);
            setError(null);
        };
        reader.onerror = () => {
            setError('Failed to read file');
        };
        reader.readAsText(file);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Failed to copy to clipboard');
        }
    };

    const handleDownload = () => {
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dashboard?.title || 'dashboard'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {mode === 'import' ? <Upload size={20} className="text-primary" /> : <Download size={20} className="text-primary" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">
                                {mode === 'import' ? 'Import Dashboard' : 'Export Dashboard'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {mode === 'import'
                                    ? 'Paste dashboard JSON or upload a file'
                                    : 'Copy or download the dashboard configuration'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {mode === 'import' && (
                        <div className="mb-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors text-center"
                            >
                                <FileJson size={24} className="mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Click to upload a JSON file
                                </p>
                            </button>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Dashboard JSON</label>
                            {mode === 'export' && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            className="w-full h-64 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 ring-primary focus:outline-none resize-none"
                            placeholder={mode === 'import' ? 'Paste dashboard JSON here...' : ''}
                            readOnly={mode === 'export'}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {mode === 'import' ? (
                        <button
                            onClick={handleImport}
                            disabled={!jsonContent.trim()}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                jsonContent.trim()
                                    ? "bg-primary text-primary-foreground hover:opacity-90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            <Upload size={16} />
                            Import
                        </button>
                    ) : (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                        >
                            <Download size={16} />
                            Download
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImportExportModal;
