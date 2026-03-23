'use client';

/**
 * Anomaly Detection Hook
 * 
 * Periodically checks for anomalies in a specific metric expression
 * using the AI Engine's anomaly detection service.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

interface AnomalyData {
    isAnomalous: boolean;
    score: number;
    anomalies: any[];
    baseline: {
        mean: number;
        stdDev: number;
    };
    generatedAt: string;
}

export function useAnomaly(expr: string | undefined, enabled: boolean = true) {
    const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastRefresh = useDashboardStore(s => s.lastRefresh);

    const checkAnomaly = useCallback(async () => {
        if (!expr || !enabled) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/ai-engine/anomalies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expr,
                    lookbackHours: 6, // Focus on recent data
                    threshold: 3      // Sensitivity
                })
            });

            if (!res.ok) throw new Error('Failed to fetch anomaly data');
            const data = await res.json();
            setAnomalyData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [expr, enabled]);

    useEffect(() => {
        checkAnomaly();
    }, [checkAnomaly, lastRefresh]);

    return { anomalyData, isLoading, error };
}
