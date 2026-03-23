"use client";

import React, { useState, useRef } from 'react';
import {
    MoreVertical,
    Maximize2,
    Minimize2,
    Edit3,
    Copy,
    Trash2,
    GripVertical,
    RefreshCw,
    ExternalLink,
    AlertTriangle,
    MessageSquare,
    ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Panel, useDashboardStore } from '@/stores/dashboardStore';
import { getWidgetComponent } from '../widgets/registry';
import { WidgetComments } from './WidgetComments';


interface PanelContainerProps {
    panel: Panel;
    isFullscreen?: boolean;
}

export function PanelContainer({ panel, isFullscreen = false }: PanelContainerProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDiscussing, setIsDiscussing] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);


    const {
        enterEditMode,
        enterViewMode,
        exitViewMode,
        duplicatePanel,
        deletePanel,
        panelStates,
        timeRange,
        variableValues,
        lastRefresh
    } = useDashboardStore();

    const panelState = panelStates[panel.id];
    const isLoading = panelState?.isLoading ?? false;
    const error = panelState?.error;

    const WidgetComponent = getWidgetComponent(panel.type);

    const handleEdit = () => {
        enterEditMode(panel.id);
        setIsMenuOpen(false);
    };

    const handleView = () => {
        if (isFullscreen) {
            exitViewMode();
        } else {
            enterViewMode(panel.id);
        }
        setIsMenuOpen(false);
    };

    const handleDuplicate = () => {
        duplicatePanel(panel.id);
        setIsMenuOpen(false);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this panel?')) {
            deletePanel(panel.id);
        }
        setIsMenuOpen(false);
    };

    return (
        <div
            className={cn(
                "h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all",
                isHovered && "ring-1 ring-primary/30",
                isFullscreen && "fixed inset-4 z-50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setIsMenuOpen(false); }}
        >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical
                        size={14}
                        className="panel-drag-handle text-muted-foreground/50 cursor-move shrink-0 hover:text-muted-foreground"
                    />
                    <h3 className="font-medium text-sm truncate">{panel.title}</h3>
                    {isLoading && (
                        <RefreshCw size={12} className="text-muted-foreground animate-spin shrink-0" />
                    )}
                </div>

                <div className={cn(
                    "flex items-center gap-1 transition-opacity",
                    isHovered || isDiscussing ? "opacity-100" : "opacity-40 hover:opacity-100"
                )}>
                    <button
                        onClick={() => {
                            console.log('Discuss button clicked for panel:', panel.id);
                            setIsDiscussing(!isDiscussing);
                        }}
                        className={cn(
                            "p-1.5 rounded-md transition-all duration-200 transform active:scale-95",
                            isDiscussing
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        )}
                        title="Discuss"
                    >
                        {isDiscussing ? <ChevronLeft size={14} /> : <MessageSquare size={14} />}
                    </button>

                    <button
                        onClick={handleView}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title={isFullscreen ? "Exit fullscreen" : "View"}
                    >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                        >
                            <MoreVertical size={14} />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-xl z-[9999] py-1">
                                <MenuButton icon={<Edit3 size={14} />} label="Edit" onClick={handleEdit} />
                                <MenuButton icon={<Copy size={14} />} label="Duplicate" onClick={handleDuplicate} />
                                <MenuButton icon={<ExternalLink size={14} />} label="Share" onClick={() => setIsMenuOpen(false)} />
                                <div className="h-px bg-border my-1" />
                                <MenuButton
                                    icon={<Trash2 size={14} />}
                                    label="Delete"
                                    onClick={handleDelete}
                                    danger
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 relative overflow-hidden">
                {isDiscussing ? (
                    <div className="absolute inset-0 z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                        <WidgetComments widgetId={String(panel.id)} className="h-full border-none rounded-none shadow-none" />
                    </div>
                ) : (
                    <>
                        {error ? (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="text-center">
                                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                                    <p className="text-sm text-destructive font-medium">Error loading panel</p>
                                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                                </div>
                            </div>
                        ) : WidgetComponent ? (
                            React.createElement(WidgetComponent as any, {
                                panel: panel as any,
                                timeRange,
                                variables: variableValues,
                                width: 0,
                                height: 0,
                                lastRefresh
                            })
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">
                                    Unknown widget type: {panel.type}
                                </p>
                            </div>
                        )}

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-card/50 flex items-center justify-center">
                                <RefreshCw size={20} className="text-primary animate-spin" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

interface MenuButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

function MenuButton({ icon, label, onClick, danger }: MenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors text-left",
                danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "hover:bg-muted"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

export default PanelContainer;
