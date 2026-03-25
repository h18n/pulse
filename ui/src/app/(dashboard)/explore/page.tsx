"use client";

import React from 'react';
import Link from 'next/link';
import {
    Terminal,
    TrendingUp,
    Database,
    GitBranch,
    ArrowRight,
    Search,
    Clock,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXPLORE_OPTIONS = [
    {
        id: 'logs',
        title: 'Logs Explorer',
        description: 'Search and analyze application logs in real-time with powerful filtering and live tail capabilities.',
        icon: Terminal,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        href: '/explore/logs',
        features: ['Full-text search', 'Level filtering', 'Live tail', 'JSON parsing'],
    },
    {
        id: 'metrics',
        title: 'Metrics Explorer',
        description: 'Query and visualize Prometheus metrics with an interactive PromQL query builder.',
        icon: TrendingUp,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        href: '/explore/metrics',
        features: ['PromQL builder', 'Multi-query', 'Saved queries', 'Chart/Table views'],
    },
    {
        id: 'detective',
        title: 'Detective',
        description: 'ML-powered log clustering and anomaly detection using Isolation Forest algorithms.',
        icon: Search,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        href: '/explore/detective',
        features: ['Pattern clustering', 'Anomaly scoring', 'Deployment diffs', 'Isolation Forest'],
    },
    {
        id: 'traces',
        title: 'Traces Explorer',
        description: 'Trace distributed requests across microservices to identify bottlenecks and errors.',
        icon: GitBranch,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        href: '/explore/traces',
        features: ['Trace timeline', 'Span details', 'Service map', 'Latency analysis'],
        comingSoon: true,
    },
    {
        id: 'profiling',
        title: 'Continuous Profiling',
        description: 'Analyze CPU and memory profiles to optimize application performance.',
        icon: Zap,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        href: '/explore/profiling',
        features: ['Flame graphs', 'CPU profiling', 'Memory profiling', 'Diff analysis'],
        comingSoon: true,
    },
];

export default function ExplorePage() {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Search size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Explore</h1>
                        <p className="text-sm text-muted-foreground">
                            Query and analyze your observability data
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                    {EXPLORE_OPTIONS.map(option => (
                        <ExploreCard key={option.id} {...option} />
                    ))}
                </div>

                {/* Quick Tips */}
                <div className="mt-8 max-w-5xl">
                    <h2 className="text-lg font-semibold mb-4">Quick Tips</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TipCard
                            icon={<Search size={16} />}
                            title="Search Syntax"
                            description="Use quotes for exact matches, | for OR, and - to exclude terms."
                        />
                        <TipCard
                            icon={<Clock size={16} />}
                            title="Time Ranges"
                            description="Select relative time ranges or specify absolute timestamps for precise queries."
                        />
                        <TipCard
                            icon={<Database size={16} />}
                            title="Data Sources"
                            description="Query data from Prometheus, Loki, Tempo, and other connected sources."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ExploreCardProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bg: string;
    href: string;
    features: string[];
    comingSoon?: boolean;
}

function ExploreCard({ title, description, icon: Icon, color, bg, href, features, comingSoon }: ExploreCardProps) {
    const Card = comingSoon ? 'div' : Link;

    return (
        <Card
            href={comingSoon ? undefined! : href}
            className={cn(
                "block p-6 bg-card border border-border rounded-xl transition-all",
                comingSoon
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group"
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bg)}>
                    <Icon size={24} className={color} />
                </div>
                {comingSoon ? (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Coming Soon
                    </span>
                ) : (
                    <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                )}
            </div>

            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>

            <div className="flex flex-wrap gap-2">
                {features.map(feature => (
                    <span
                        key={feature}
                        className="text-xs bg-muted px-2 py-1 rounded"
                    >
                        {feature}
                    </span>
                ))}
            </div>
        </Card>
    );
}

interface TipCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function TipCard({ icon, title, description }: TipCardProps) {
    return (
        <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-primary">
                {icon}
                <span className="text-sm font-medium">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );
}
