'use client';

/**
 * Topology Page
 * 
 * Displays the full network and service dependency graph.
 * Allows interactive exploration of dependencies and ripple-effects of failures.
 */

import React, { useState } from 'react';
import Shell from '@/components/layout/Shell';
import { ImpactGraph } from '@/features/topology/components/ImpactGraph';
import { Network, Search, Filter, Info, ChevronRight, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopologyPage() {
    const [selectedNodeId, setSelectedNodeId] = useState<string>('dev-001');

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-6 bg-card/30 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Network className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">System Topology</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Live dependency map & blast radius analysis
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find node or service..."
                            className="h-10 w-64 bg-muted/50 border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <button className="h-10 px-4 flex items-center gap-2 bg-muted/50 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="h-10 px-4 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95">
                        <Zap className="w-4 h-4 fill-current" />
                        Simulate Failure
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-80 border-r flex flex-col bg-card/20 overflow-y-auto">
                    <div className="p-4 border-b">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Quick Insights</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card border rounded-lg p-3">
                                <div className="text-2xl font-bold">124</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Nodes</div>
                            </div>
                            <div className="bg-card border rounded-lg p-3">
                                <div className="text-2xl font-bold">342</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Edges</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Critical Paths</h2>
                        <div className="space-y-2">
                            {[
                                { name: 'Checkout Pipeline', nodes: 8, status: 'stable' },
                                { name: 'Payment Gateway', nodes: 5, status: 'warning' },
                                { name: 'Core NYC Router', nodes: 12, status: 'stable' },
                                { name: 'London Link', nodes: 4, status: 'stable' },
                            ].map((path) => (
                                <button
                                    key={path.name}
                                    className="w-full p-3 rounded-lg border bg-card/30 hover:bg-card hover:border-primary/50 transition-all flex items-center justify-between text-left group"
                                >
                                    <div>
                                        <div className="font-medium text-sm">{path.name}</div>
                                        <div className="text-xs text-muted-foreground">{path.nodes} nodes affected</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto p-4 border-t bg-muted/30">
                        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-blue-500">How to use</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                    Click on any node to analyze its dependencies. Edges show the flow of traffic/dependency. Highlighted nodes indicate the blast radius.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Graph Area */}
                <section className="flex-1 relative">
                    <ImpactGraph nodeId={selectedNodeId} />

                    {/* Floating Controls Overlay */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                        <div className="bg-card/80 backdrop-blur-md border rounded-xl p-6 shadow-2xl max-w-sm">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Selection Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Active Selection</div>
                                    <div className="text-sm font-mono bg-muted/50 p-2 rounded border">{selectedNodeId}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Impact Analysis</div>
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg leading-relaxed italic">
                                        "Failure of this node will disrupt 4 downstream services and may trigger up to 12 correlated alerts across 2 regions."
                                    </div>
                                </div>
                                <button className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
                                    View Service Analytics
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
