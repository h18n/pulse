'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandle {
    position: 'right' | 'bottom' | 'corner';
    cursor: string;
}

const resizeHandles: ResizeHandle[] = [
    { position: 'right', cursor: 'ew-resize' },
    { position: 'bottom', cursor: 'ns-resize' },
    { position: 'corner', cursor: 'nwse-resize' },
];

interface ResizablePanelProps {
    children: React.ReactNode;
    initialWidth: number; // Grid columns (1-12)
    initialHeight: number; // Grid rows
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    isEditing: boolean;
    onResize: (width: number, height: number) => void;
    className?: string;
}

export function ResizablePanel({
    children,
    initialWidth,
    initialHeight,
    minWidth = 3,
    maxWidth = 12,
    minHeight = 2,
    maxHeight = 12,
    isEditing,
    onResize,
    className,
}: ResizablePanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeType, setResizeType] = useState<'right' | 'bottom' | 'corner' | null>(null);
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    // Track starting position and dimensions
    const startPos = useRef({ x: 0, y: 0 });
    const startDimensions = useRef({ width: initialWidth, height: initialHeight });

    // Grid unit sizes (approximate pixels per grid unit)
    const GRID_COL_WIDTH = 100; // pixels per column
    const GRID_ROW_HEIGHT = 50; // pixels per row

    const handleMouseDown = useCallback((e: React.MouseEvent, type: 'right' | 'bottom' | 'corner') => {
        if (!isEditing) return;

        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        setResizeType(type);
        startPos.current = { x: e.clientX, y: e.clientY };
        startDimensions.current = { ...dimensions };
    }, [isEditing, dimensions]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !resizeType) return;

        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;

        let newWidth = startDimensions.current.width;
        let newHeight = startDimensions.current.height;

        if (resizeType === 'right' || resizeType === 'corner') {
            // Convert pixel delta to grid columns
            const colDelta = Math.round(deltaX / GRID_COL_WIDTH);
            newWidth = Math.max(minWidth, Math.min(maxWidth, startDimensions.current.width + colDelta));
        }

        if (resizeType === 'bottom' || resizeType === 'corner') {
            // Convert pixel delta to grid rows
            const rowDelta = Math.round(deltaY / GRID_ROW_HEIGHT);
            newHeight = Math.max(minHeight, Math.min(maxHeight, startDimensions.current.height + rowDelta));
        }

        setDimensions({ width: newWidth, height: newHeight });
    }, [isResizing, resizeType, minWidth, maxWidth, minHeight, maxHeight]);

    const handleMouseUp = useCallback(() => {
        if (isResizing) {
            onResize(dimensions.width, dimensions.height);
            setIsResizing(false);
            setResizeType(null);
        }
    }, [isResizing, dimensions, onResize]);

    // Attach global event listeners when resizing
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = resizeType === 'corner' ? 'nwse-resize' :
                resizeType === 'right' ? 'ew-resize' : 'ns-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp, resizeType]);

    // Update dimensions when initial values change
    useEffect(() => {
        setDimensions({ width: initialWidth, height: initialHeight });
    }, [initialWidth, initialHeight]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative",
                isResizing && "z-10",
                className
            )}
            style={{
                gridColumn: `span ${dimensions.width}`,
                minHeight: `${dimensions.height * GRID_ROW_HEIGHT}px`,
            }}
        >
            {children}

            {/* Resize handles - only visible in edit mode */}
            {isEditing && (
                <>
                    {/* Right edge handle */}
                    <div
                        className={cn(
                            "absolute top-0 right-0 w-2 h-full cursor-ew-resize",
                            "opacity-0 hover:opacity-100 transition-opacity",
                            "bg-gradient-to-l from-primary/20 to-transparent",
                            isResizing && resizeType === 'right' && "opacity-100 bg-primary/30"
                        )}
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        data-testid="resize-handle-right"
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-8 bg-primary rounded-full" />
                    </div>

                    {/* Bottom edge handle */}
                    <div
                        className={cn(
                            "absolute bottom-0 left-0 w-full h-2 cursor-ns-resize",
                            "opacity-0 hover:opacity-100 transition-opacity",
                            "bg-gradient-to-t from-primary/20 to-transparent",
                            isResizing && resizeType === 'bottom' && "opacity-100 bg-primary/30"
                        )}
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                        data-testid="resize-handle-bottom"
                    >
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full" />
                    </div>

                    {/* Corner handle */}
                    <div
                        className={cn(
                            "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize",
                            "opacity-0 hover:opacity-100 transition-opacity",
                            isResizing && resizeType === 'corner' && "opacity-100"
                        )}
                        onMouseDown={(e) => handleMouseDown(e, 'corner')}
                        data-testid="resize-handle-corner"
                    >
                        <svg
                            className="w-4 h-4 text-primary"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <path d="M14 16H16V14H14V16ZM10 16H12V14H10V16ZM6 16H8V14H6V16ZM14 12H16V10H14V12ZM10 12H12V10H10V12ZM14 8H16V6H14V8Z" />
                        </svg>
                    </div>
                </>
            )}

            {/* Resize feedback overlay */}
            {isResizing && (
                <div className="absolute inset-0 border-2 border-primary border-dashed rounded-xl pointer-events-none">
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                        {dimensions.width} × {dimensions.height}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResizablePanel;
