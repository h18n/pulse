"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MoreVertical, Maximize2, RefreshCcw, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const LATENCY_DATA = [
    { time: '10:00', value: 45 },
    { time: '10:05', value: 52 },
    { time: '10:10', value: 48 },
    { time: '10:15', value: 61 },
    { time: '10:20', value: 55 },
    { time: '10:25', value: 42 },
    { time: '10:30', value: 38 },
    { time: '10:35', value: 44 },
];

const TRAFFIC_DATA = [
    { time: '10:00', inbound: 400, outbound: 240 },
    { time: '10:05', inbound: 300, outbound: 139 },
    { time: '10:10', inbound: 600, outbound: 380 },
    { time: '10:15', inbound: 800, outbound: 430 },
    { time: '10:20', inbound: 500, outbound: 320 },
    { time: '10:25', inbound: 900, outbound: 480 },
];

const REGION_DATA = [
    { region: 'US-EAST', alerts: 18, devices: 42 },
    { region: 'US-WEST', alerts: 8, devices: 31 },
    { region: 'EU-WEST', alerts: 12, devices: 28 },
    { region: 'APAC', alerts: 5, devices: 19 },
];

export default function DashboardGrid() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Network Core Performance</h1>
                    <p className="text-muted-foreground">Monitoring latency and throughput across core regional switches</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg text-sm hover:bg-muted/80 transition-colors">
                        <RefreshCcw size={16} />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
                        <Plus size={16} />
                        Add Widget
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total Devices" value="127" change="+3" positive />
                <StatCard label="Active Alerts" value="23" change="+5" positive={false} />
                <StatCard label="Avg Latency" value="45ms" change="-12%" positive />
                <StatCard label="Uptime" value="99.94%" change="+0.02%" positive />
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-12 gap-4">
                {/* Latency Chart - Span 6 */}
                <div className="col-span-6 glass-card overflow-hidden">
                    <WidgetHeader title="Core Latency (ICMP)" subtitle="Real-time ping response" />
                    <div className="h-64 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={LATENCY_DATA}>
                                <defs>
                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Traffic Chart - Span 6 */}
                <div className="col-span-6 glass-card overflow-hidden">
                    <WidgetHeader title="Traffic Distribution" subtitle="Inbound vs Outbound (Gbps)" />
                    <div className="h-64 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TRAFFIC_DATA}>
                                <defs>
                                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInbound)" />
                                <Area type="monotone" dataKey="outbound" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorOutbound)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Regional Overview - Span 4 */}
                <div className="col-span-4 glass-card overflow-hidden">
                    <WidgetHeader title="Regional Overview" subtitle="Alerts by region" />
                    <div className="h-64 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={REGION_DATA} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="region" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={60} />
                                <Tooltip contentStyle={{ backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} />
                                <Bar dataKey="alerts" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Active Incidents - Span 8 */}
                <div className="col-span-8 glass-card overflow-hidden">
                    <WidgetHeader title="Active Incidents" subtitle="Last 24 hours" />
                    <div className="max-h-64 overflow-auto px-6 py-4">
                        <AlertList />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, change, positive }: { label: string; value: string; change: string; positive: boolean }) {
    return (
        <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-end justify-between mt-1">
                <p className="text-3xl font-bold">{value}</p>
                <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    positive ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                )}>
                    {change}
                </span>
            </div>
        </div>
    );
}

function WidgetHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
                <GripVertical size={14} className="text-muted-foreground/50 cursor-move" />
                <div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <Maximize2 size={14} className="cursor-pointer" />
                <MoreVertical size={14} className="cursor-pointer" />
            </div>
        </div>
    );
}

function AlertList() {
    const alerts = [
        { id: 1, type: 'Critical', msg: 'Core Router NYC-01 Port Flap', group: 'NYC-DC-01', status: 'Firing', time: '2m ago' },
        { id: 2, type: 'Warning', msg: 'High PDU Temperature Rack 42', group: 'LON-DC-05', status: 'Firing', time: '14m ago' },
        { id: 3, type: 'Warning', msg: 'Interface Utilization > 90%', group: 'NYC-DC-01', status: 'Firing', time: '28m ago' },
        { id: 4, type: 'Info', msg: 'BGP Peer Session Re-established', group: 'SFO-DC-03', status: 'Resolved', time: '1h ago' },
        { id: 5, type: 'Critical', msg: 'Sensor Offline - Environmental', group: 'SFO-DC-03', status: 'Firing', time: '2h ago' },
    ];

    return (
        <div className="space-y-3">
            {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            alert.type === 'Critical' ? "bg-destructive animate-pulse" :
                                alert.type === 'Warning' ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <div>
                            <p className="text-sm font-medium">{alert.msg}</p>
                            <p className="text-xs text-muted-foreground">{alert.group}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-mono opacity-60">{alert.time}</p>
                        <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold",
                            alert.status === 'Firing' ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                            {alert.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
