/**
 * Anomaly Detection Service
 * 
 * Provides statistical anomaly detection for time-series data.
 * Uses Z-Score and Interquartile Range (IQR) methods to identify outliers.
 */

import { pino } from 'pino';

const logger = pino({
    transport: { target: 'pino-pretty', options: { colorize: true } }
});

export interface DataPoint {
    timestamp: number;
    value: number;
}

export interface AnomalyResult {
    isAnomalous: boolean;
    score: number; // 0 to 1
    anomalies: DataPoint[];
    baseline: {
        mean: number;
        stdDev: number;
    };
}

export class AnomalyService {
    /**
     * Detect anomalies using Z-Score method
     * Z = (x - mean) / stdDev
     */
    static detectZScore(data: DataPoint[], threshold: number = 3): AnomalyResult {
        if (data.length < 5) {
            return { isAnomalous: false, score: 0, anomalies: [], baseline: { mean: 0, stdDev: 0 } };
        }

        const values = data.map(p => p.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(v => Math.pow(v - mean, 2));
        const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);

        if (stdDev === 0) {
            return { isAnomalous: false, score: 0, anomalies: [], baseline: { mean, stdDev } };
        }

        const anomalies = data.filter(p => {
            const z = Math.abs((p.value - mean) / stdDev);
            return z > threshold;
        });

        // Calculate score based on number of anomalous points in the recent 20% of data
        const recentCount = Math.floor(data.length * 0.2);
        const recentAnomalies = anomalies.filter(p => data.indexOf(p) >= data.length - recentCount);
        const score = Math.min(recentAnomalies.length / (recentCount || 1), 1);

        return {
            isAnomalous: score > 0.1,
            score,
            anomalies,
            baseline: { mean, stdDev }
        };
    }

    /**
     * Detect anomalies using IQR method (more robust to outliers)
     */
    static detectIQR(data: DataPoint[]): AnomalyResult {
        const values = [...data.map(p => p.value)].sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;

        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const anomalies = data.filter(p => p.value < lowerBound || p.value > upperBound);
        const score = anomalies.length / data.length;

        return {
            isAnomalous: anomalies.length > 0,
            score,
            anomalies,
            baseline: { mean: (q1 + q3) / 2, stdDev: iqr }
        };
    }
}
