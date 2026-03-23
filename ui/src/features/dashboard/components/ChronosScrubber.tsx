'use client';

/**
 * Chronos Scrubber Component
 * 
 * Provides a global time-travel slider for the dashboard.
 * Allows scrubbing through past data with a high-performance interactive UI.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import {
    History,
    Play,
    Pause,
    FastForward,
    Rewind,
    X,
    Clock,
    Activity,
    AlertTriangle,
    Tag,
    PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


export function ChronosScrubber() {
    const {
        isScrubbing,
        toggleScrubbing,
        scrubbedTime,
        setScrubbedTime,
        timeRange,
        markers,
        addMarker
    } = useDashboardStore();


    const [range, setRange] = useState({ min: 0, max: 0 });
    const sliderRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Calculate the range for the slider based on the current context
        // default to last 24 hours of window
        const now = Date.now();
        const start = now - 24 * 60 * 60 * 1000;
        setRange({ min: start, max: now });

        if (isScrubbing && !scrubbedTime) {
            setScrubbedTime(now);
        }
    }, [isScrubbing, scrubbedTime, setScrubbedTime]);

    if (!isScrubbing) return null;

    const currentTime = scrubbedTime || Date.now();
    const percent = ((currentTime - range.min) / (range.max - range.min)) * 100;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-card/80 backdrop-blur-2xl border-2 border-primary/20 rounded-2xl shadow-2xl p-6 relative overflow-hidden group">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 ring-4 ring-primary/5">
                            <History className="text-primary w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/70">Chronos Engine Active</div>
                            <div className="text-xl font-black tracking-tighter flex items-center gap-2">
                                {format(currentTime, 'MMM dd, HH:mm:ss')}
                                <span className="text-primary/50 text-xs font-mono ml-2">[{Math.round(percent)}%]</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 mr-2">
                            <AlertTriangle size={10} />
                            VIEWING HISTORICAL STATE
                        </div>
                        <button
                            onClick={() => toggleScrubbing(false)}
                            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Slider Control */}
                <div className="relative h-12 flex items-center px-2">
                    <div className="absolute inset-0 flex items-center py-5 px-2">
                        <div className="w-full h-1.5 bg-muted rounded-full relative overflow-hidden">
                            <div
                                className="absolute h-full bg-primary/30"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>

                    <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        value={currentTime}
                        onChange={(e) => setScrubbedTime(parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />

                    {/* Markers */}
                    {markers.map(marker => {
                        const mPercent = ((marker.timestamp - range.min) / (range.max - range.min)) * 100;
                        if (mPercent < 0 || mPercent > 100) return null;

                        return (
                            <div
                                key={marker.id}
                                className={cn(
                                    "absolute w-1 h-3 top-1/2 -translate-y-1/2 z-10 rounded-full",
                                    marker.type === 'incident' ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
                                        marker.type === 'fix' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-primary"
                                )}
                                style={{ left: `${mPercent}%` }}
                                title={`${marker.label} (${marker.type})`}
                            />
                        );
                    })}

                    {/* Custom Thumb */}
                    <div
                        className="absolute w-6 h-6 bg-primary rounded-full shadow-lg shadow-primary/50 border-4 border-background pointer-events-none z-30 transition-transform hover:scale-125"
                        style={{ left: `calc(${percent}% - 12px)` }}
                    >

                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {format(currentTime, 'HH:mm')}
                        </div>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-8 mt-2 opacity-70 group-hover:opacity-100 transition-opacity relative">
                    <button className="hover:text-primary transition-colors"><Rewind size={20} /></button>
                    <button className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all hover:scale-110">
                        <Play size={24} className="text-primary fill-current ml-1" />
                    </button>
                    <button className="hover:text-primary transition-colors"><FastForward size={20} /></button>

                    <button
                        onClick={() => addMarker({
                            timestamp: currentTime,
                            label: 'Observation',
                            type: 'note'
                        })}
                        className="absolute right-0 flex items-center gap-2 text-[10px] font-bold text-primary hover:scale-105 transition-transform"
                    >
                        <PlusCircle size={14} />
                        ADD MARKER
                    </button>
                </div>


                {/* Info Bar */}
                <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Clock size={12} />
                        {format(range.min, 'MMM dd, HH:mm')}
                    </div>
                    <div className="flex items-center gap-2 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                        <Activity size={12} className="text-primary" />
                        Synchronizing all widgets
                    </div>
                    <div>
                        NOW
                    </div>
                </div>
            </div>
        </div>
    );
}
