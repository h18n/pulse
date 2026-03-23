'use client';

/**
 * Impact Graph Component
 * 
 * Visualizes the blast radius of a failure using a dependency graph.
 * Uses reactflow to render the nodes and edges.
 * 
 * @module features/topology/ImpactGraph
 */

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    MarkerType,
    useNodesState,
    useEdgesState,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertCircle, Server, Database, Globe, Box, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============== Types ==============

interface TopologyNode {
    id: string;
    label: string;
    type: 'switch' | 'router' | 'pdu' | 'sensor' | 'server' | 'service';
    data: any;
}

interface ImpactResponse {
    rootCause: string;
    affectedIds: string[];
    affectedNodes: any[];
}

interface ImpactGraphProps {
    nodeId: string;
    className?: string;
}

// ============== Custom Node Component ==============

const CustomNode = ({ data, selected }: any) => {
    const Icon = data.type === 'service' ? Box :
        data.type === 'router' || data.type === 'switch' ? Globe :
            data.type === 'server' ? Server : AlertCircle;

    const isRoot = data.isRoot;
    const isAffected = data.isAffected;

    return (
        <div className={cn(
            "px-4 py-2 shadow-md rounded-md border-2 bg-card text-card-foreground transition-all duration-300",
            selected ? "border-primary" : "border-border",
            isRoot && "border-destructive animate-pulse bg-destructive/10",
            isAffected && !isRoot && "border-amber-500 bg-amber-500/10"
        )}>
            <Handle type="target" position={Position.Top} className="w-16 !bg-muted" />
            <div className="flex items-center">
                <div className={cn(
                    "rounded-full p-2 mr-3",
                    isRoot ? "bg-destructive text-destructive-foreground" :
                        isAffected ? "bg-amber-500 text-amber-foreground" : "bg-muted"
                )}>
                    <Icon size={16} />
                </div>
                <div>
                    <div className="text-xs font-bold uppercase opacity-50">{data.type}</div>
                    <div className="text-sm font-medium">{data.label}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-16 !bg-muted" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// ============== Main Component ==============

export function ImpactGraph({ nodeId, className }: ImpactGraphProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch full topology and impact data
            const [topoRes, impactRes] = await Promise.all([
                fetch('/api/devices/topology'), // Need to add this proxy
                fetch(`/api/devices/impact/${nodeId}`) // Need to add this proxy
            ]);

            if (!topoRes.ok || !impactRes.ok) throw new Error('Failed to fetch topology data');

            const topoData = await topoRes.json();
            const impactData: ImpactResponse = await impactRes.json();

            // Create nodes
            const initialNodes: Node[] = topoData.nodes.map((n: any, i: number) => ({
                id: n.id,
                type: 'custom',
                position: { x: (i % 3) * 250, y: Math.floor(i / 3) * 150 },
                data: {
                    label: n.label,
                    type: n.type,
                    isRoot: n.id === nodeId,
                    isAffected: impactData.affectedIds.includes(n.id) || n.id === nodeId
                }
            }));

            // Create edges
            const initialEdges: Edge[] = topoData.edges.map((e: any) => ({
                id: `e-${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
                animated: impactData.affectedIds.includes(e.source) && impactData.affectedIds.includes(e.target) || e.target === nodeId,
                style: {
                    stroke: (impactData.affectedIds.includes(e.source) || e.source === nodeId) ? '#f59e0b' : '#334155',
                    strokeWidth: 2
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: (impactData.affectedIds.includes(e.source) || e.source === nodeId) ? '#f59e0b' : '#334155',
                },
            }));

            setNodes(initialNodes);
            setEdges(initialEdges);
        } catch (err: any) {
            setError(err.message);
            // Fallback for demo
            setNodes(generateMockNodes(nodeId));
            setEdges(generateMockEdges(nodeId));
        } finally {
            setIsLoading(false);
        }
    }, [nodeId, setNodes, setEdges]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg", className)}>
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Calculating blast radius...</p>
            </div>
        );
    }

    if (error && nodes.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-12 bg-destructive/5 rounded-lg border border-destructive/20", className)}>
                <AlertCircle className="w-8 h-8 text-destructive mb-4" />
                <p className="text-destructive font-medium">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={cn("h-[500px] w-full border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm relative", className)}>
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-card/80 border px-3 py-1.5 rounded-md text-xs flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="font-semibold text-destructive">ROOT CAUSE</span>
                </div>
                <div className="bg-card/80 border px-3 py-1.5 rounded-md text-xs flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-semibold text-amber-500">BLAST RADIUS (IMPACTED)</span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-dot-pattern"
            >
                <Background color="#334155" gap={20} size={1} />
                <Controls />
                <MiniMap
                    nodeColor={(n: any) => {
                        if (n.data.isRoot) return 'crimson';
                        if (n.data.isAffected) return 'orange';
                        return '#334155';
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>
        </div>
    );
}

// ============== Mock Data Generation ==============

function generateMockNodes(rootId: string): Node[] {
    return [
        { id: 'dev-001', type: 'custom', position: { x: 400, y: 0 }, data: { label: 'core-rtr-nyc-01', type: 'router', isRoot: 'dev-001' === rootId, isAffected: true } },
        { id: 'dev-002', type: 'custom', position: { x: 400, y: 150 }, data: { label: 'access-sw-nyc-01', type: 'switch', isRoot: 'dev-002' === rootId, isAffected: true } },
        { id: 'svc-payment', type: 'custom', position: { x: 200, y: 300 }, data: { label: 'payment-gateway', type: 'service', isRoot: 'svc-payment' === rootId, isAffected: true } },
        { id: 'svc-checkout', type: 'custom', position: { x: 600, y: 300 }, data: { label: 'checkout-service', type: 'service', isRoot: 'svc-checkout' === rootId, isAffected: true } },
        { id: 'dev-003', type: 'custom', position: { x: 0, y: 150 }, data: { label: 'pdu-rack42-lon', type: 'pdu', isRoot: 'dev-003' === rootId, isAffected: false } },
    ];
}

function generateMockEdges(rootId: string): Edge[] {
    return [
        { id: 'e1', source: 'dev-002', target: 'dev-001', markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2', source: 'svc-payment', target: 'dev-002', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f59e0b' } },
        { id: 'e3', source: 'svc-checkout', target: 'dev-002', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f59e0b' } },
        { id: 'e4', source: 'svc-checkout', target: 'svc-payment', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f59e0b' } },
    ];
}
