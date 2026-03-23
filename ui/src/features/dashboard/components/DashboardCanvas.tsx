"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDashboardStore, GridPos, Panel } from '@/stores/dashboardStore';
import { PanelContainer } from './PanelContainer';

interface DashboardCanvasProps {
    className?: string;
}

const GRID_COLS = 24;
const ROW_HEIGHT = 30;
const GAP = 8;

export function DashboardCanvas({ className }: DashboardCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    const { currentDashboard: dashboard, updatePanelGridPos, panelInView } = useDashboardStore();
    const panels = dashboard?.panels || [];
    const isEditable = true; // Default to true or get from somewhere else

    // Measure container width
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const colWidth = (containerWidth - GAP * (GRID_COLS - 1)) / GRID_COLS;

    const calculatePanelStyle = (gridPos: GridPos): React.CSSProperties => {
        return {
            position: 'absolute',
            left: gridPos.x * (colWidth + GAP),
            top: gridPos.y * (ROW_HEIGHT + GAP),
            width: gridPos.w * colWidth + (gridPos.w - 1) * GAP,
            height: gridPos.h * ROW_HEIGHT + (gridPos.h - 1) * GAP,
        };
    };

    const calculateGridHeight = () => {
        if (panels.length === 0) return 400;
        const maxY = Math.max(...panels.map(p => p.gridPos.y + p.gridPos.h));
        return maxY * (ROW_HEIGHT + GAP) + 50;
    };

    // Fullscreen view mode
    if (panelInView) {
        const viewPanel = panels.find(p => p.id === panelInView);
        if (viewPanel) {
            return (
                <div className="fixed inset-0 z-50 bg-background p-4">
                    <PanelContainer panel={viewPanel} isFullscreen />
                </div>
            );
        }
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: 'relative',
                minHeight: calculateGridHeight(),
            }}
        >
            {panels.map(panel => (
                <div
                    key={panel.id}
                    style={calculatePanelStyle(panel.gridPos)}
                    className="transition-all duration-200"
                >
                    <PanelContainer panel={panel} />
                </div>
            ))}

            {panels.length === 0 && (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">
                        Click "Add" to add your first panel
                    </p>
                </div>
            )}
        </div>
    );
}

export default DashboardCanvas;
