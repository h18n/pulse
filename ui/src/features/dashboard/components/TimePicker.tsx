"use client";

import React, { useState, useRef, useEffect } from 'react';
import { format, subMinutes, subHours, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, Clock, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_RANGES, REFRESH_INTERVALS, TimeRange, useDashboardStore } from '@/stores/dashboardStore';

interface TimePickerProps {
    className?: string;
}

export function TimePicker({ className }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'quick' | 'absolute'>('quick');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { timeRange, setTimeRange, refreshInterval, setRefreshInterval, triggerRefresh, lastRefresh } = useDashboardStore();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTimeDisplay = (range: TimeRange) => {
        const quickMatch = QUICK_RANGES.find(q => q.from === range.from && q.to === range.to);
        if (quickMatch) return quickMatch.display;
        return `${range.from} to ${range.to}`;
    };

    const handleQuickSelect = (from: string, to: string) => {
        setTimeRange({ from, to });
        setIsOpen(false);
    };

    return (
        <div className={cn("flex items-center gap-2", className)} ref={dropdownRef}>
            {/* Time Range Selector */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 border border-border rounded-lg px-3 py-2 text-sm transition-colors"
                >
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="font-medium">{formatTimeDisplay(timeRange)}</span>
                    <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <div className="absolute top-full right-0 mt-2 w-[480px] bg-card border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setActiveTab('quick')}
                                className={cn(
                                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'quick'
                                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Quick ranges
                            </button>
                            <button
                                onClick={() => setActiveTab('absolute')}
                                className={cn(
                                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'absolute'
                                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Absolute time range
                            </button>
                        </div>

                        {activeTab === 'quick' && (
                            <div className="p-4 grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                                {QUICK_RANGES.map((range) => (
                                    <button
                                        key={range.display}
                                        onClick={() => handleQuickSelect(range.from, range.to)}
                                        className={cn(
                                            "px-3 py-2 text-sm rounded-lg text-left transition-colors",
                                            timeRange.from === range.from && timeRange.to === range.to
                                                ? "bg-primary/20 text-primary"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        {range.display}
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === 'absolute' && (
                            <div className="p-4">
                                <AbsoluteTimePicker
                                    value={timeRange}
                                    onChange={(range) => { setTimeRange(range); setIsOpen(false); }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Zoom Out */}
            <button
                onClick={() => {
                    // Simple zoom out implementation
                    const zoomMap: Record<string, string> = {
                        'now-5m': 'now-15m',
                        'now-15m': 'now-1h',
                        'now-30m': 'now-3h',
                        'now-1h': 'now-6h',
                        'now-3h': 'now-12h',
                        'now-6h': 'now-24h',
                        'now-12h': 'now-2d',
                        'now-24h': 'now-7d',
                        'now-2d': 'now-7d',
                        'now-7d': 'now-30d',
                        'now-30d': 'now-90d',
                    };
                    if (zoomMap[timeRange.from]) {
                        setTimeRange({ from: zoomMap[timeRange.from], to: 'now' });
                    }
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Zoom out"
            >
                <Zap size={16} className="text-muted-foreground" />
            </button>

            {/* Refresh Controls */}
            <RefreshPicker
                value={refreshInterval}
                onChange={setRefreshInterval}
                onRefresh={triggerRefresh}
                lastRefresh={lastRefresh}
            />
        </div>
    );
}

// ============== Absolute Time Picker ==============

interface AbsoluteTimePickerProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
}

function AbsoluteTimePicker({ value, onChange }: AbsoluteTimePickerProps) {
    const [from, setFrom] = useState(value.from);
    const [to, setTo] = useState(value.to);

    const handleApply = () => {
        onChange({ from, to });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">From</label>
                    <input
                        type="text"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        placeholder="now-6h or 2024-01-01T00:00:00Z"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 ring-primary focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs text-muted-foreground mb-1">To</label>
                    <input
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="now or 2024-01-07T23:59:59Z"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 ring-primary focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    Use relative time like <code className="bg-muted px-1 rounded">now-1h</code> or absolute ISO dates
                </p>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Apply time range
                </button>
            </div>
        </div>
    );
}

// ============== Refresh Picker ==============

interface RefreshPickerProps {
    value: string;
    onChange: (interval: string) => void;
    onRefresh: () => void;
    lastRefresh: number;
}

function RefreshPicker({ value, onChange, onRefresh, lastRefresh }: RefreshPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-refresh effect
    useEffect(() => {
        if (!value) return;

        const parseInterval = (interval: string): number => {
            const match = interval.match(/^(\d+)([smhd])$/);
            if (!match) return 0;
            const [, num, unit] = match;
            const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
            return parseInt(num) * (multipliers[unit] || 0);
        };

        const ms = parseInterval(value);
        if (ms > 0) {
            const timer = setInterval(onRefresh, ms);
            return () => clearInterval(timer);
        }
    }, [value, onRefresh]);

    const displayLabel = value ? REFRESH_INTERVALS.find(r => r.value === value)?.label || value : 'Off';

    return (
        <div className="flex items-center gap-1" ref={dropdownRef}>
            <button
                onClick={onRefresh}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Refresh now"
            >
                <RefreshCw size={16} className="text-muted-foreground" />
            </button>

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                >
                    {value && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                    {displayLabel}
                    <ChevronDown size={12} />
                </button>

                {isOpen && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-card border border-border rounded-lg shadow-xl z-[9999] py-1">
                        {REFRESH_INTERVALS.map((interval) => (
                            <button
                                key={interval.value}
                                onClick={() => { onChange(interval.value); setIsOpen(false); }}
                                className={cn(
                                    "w-full px-3 py-1.5 text-left text-sm transition-colors",
                                    value === interval.value
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                )}
                            >
                                {interval.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TimePicker;
