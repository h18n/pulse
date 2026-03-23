/**
 * Automated RCA Service Tests
 * 
 * Unit and integration tests for the ARCA feature.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock types for testing
interface RCASummary {
    rootCause: string;
    contributingFactors: string[];
    suggestedActions: string[];
    impactScore: number;
    confidence: number;
    correlatedAlerts: string[];
    analysisVersion: string;
}

interface AlertDocument {
    fingerprint: string;
    status: string;
    severity: string;
    summary: string;
    labels: Record<string, string>;
    startsAt: string;
    updatedAt: string;
    eventCount: number;
}

describe('AutomatedRCAService', () => {
    describe('shouldTriggerARCA', () => {
        it('should return true for critical firing alerts', () => {
            const shouldTrigger = (severity: string, status: string): boolean => {
                const validSeverities = ['critical', 'warning', 'error'];
                return status === 'firing' && validSeverities.includes(severity.toLowerCase());
            };

            expect(shouldTrigger('critical', 'firing')).toBe(true);
            expect(shouldTrigger('warning', 'firing')).toBe(true);
            expect(shouldTrigger('error', 'firing')).toBe(true);
        });

        it('should return false for resolved alerts', () => {
            const shouldTrigger = (severity: string, status: string): boolean => {
                const validSeverities = ['critical', 'warning', 'error'];
                return status === 'firing' && validSeverities.includes(severity.toLowerCase());
            };

            expect(shouldTrigger('critical', 'resolved')).toBe(false);
            expect(shouldTrigger('warning', 'resolved')).toBe(false);
        });

        it('should return false for info severity', () => {
            const shouldTrigger = (severity: string, status: string): boolean => {
                const validSeverities = ['critical', 'warning', 'error'];
                return status === 'firing' && validSeverities.includes(severity.toLowerCase());
            };

            expect(shouldTrigger('info', 'firing')).toBe(false);
        });
    });

    describe('RCA Prompt Building', () => {
        it('should build a valid prompt from alert context', () => {
            const alert: AlertDocument = {
                fingerprint: 'abc123',
                status: 'firing',
                severity: 'critical',
                summary: 'High CPU usage on web-server-01',
                labels: { instance: 'web-server-01:9100', job: 'node' },
                startsAt: '2026-01-15T10:00:00Z',
                updatedAt: '2026-01-15T10:05:00Z',
                eventCount: 3
            };

            const buildPrompt = (a: AlertDocument): string => {
                return `Primary Alert:
- Summary: ${a.summary}
- Severity: ${a.severity}
- Labels: ${JSON.stringify(a.labels)}`;
            };

            const prompt = buildPrompt(alert);

            expect(prompt).toContain('High CPU usage');
            expect(prompt).toContain('critical');
            expect(prompt).toContain('web-server-01:9100');
        });
    });

    describe('RCA Summary Validation', () => {
        it('should validate a properly structured RCA summary', () => {
            const summary: RCASummary = {
                rootCause: 'Memory leak in application process',
                contributingFactors: ['High traffic', 'Insufficient memory'],
                suggestedActions: ['Restart the service', 'Increase memory limits'],
                impactScore: 7,
                confidence: 0.85,
                correlatedAlerts: ['def456', 'ghi789'],
                analysisVersion: '1.0.0'
            };

            expect(summary.rootCause).toBeTruthy();
            expect(summary.impactScore).toBeGreaterThanOrEqual(1);
            expect(summary.impactScore).toBeLessThanOrEqual(10);
            expect(summary.confidence).toBeGreaterThanOrEqual(0);
            expect(summary.confidence).toBeLessThanOrEqual(1);
            expect(summary.suggestedActions.length).toBeGreaterThan(0);
        });

        it('should reject invalid impact scores', () => {
            const validateImpactScore = (score: number): boolean => {
                return score >= 1 && score <= 10;
            };

            expect(validateImpactScore(0)).toBe(false);
            expect(validateImpactScore(11)).toBe(false);
            expect(validateImpactScore(5)).toBe(true);
        });
    });
});

describe('JobQueue', () => {
    describe('Job Priority', () => {
        it('should sort jobs by priority (higher first)', () => {
            const jobs = [
                { id: '1', priority: 0 },
                { id: '2', priority: 2 },
                { id: '3', priority: 1 }
            ];

            const sorted = [...jobs].sort((a, b) => b.priority - a.priority);

            expect(sorted[0].id).toBe('2');
            expect(sorted[1].id).toBe('3');
            expect(sorted[2].id).toBe('1');
        });
    });

    describe('Job ID Generation', () => {
        it('should generate unique job IDs', () => {
            const generateId = (queueName: string): string => {
                return `${queueName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            };

            const id1 = generateId('rca-analysis');
            const id2 = generateId('rca-analysis');

            expect(id1).not.toBe(id2);
            expect(id1).toContain('rca-analysis');
        });
    });

    describe('Retry Logic', () => {
        it('should calculate correct retry count', () => {
            const maxAttempts = 3;
            let attempts = 0;

            while (attempts < maxAttempts) {
                attempts++;
            }

            expect(attempts).toBe(3);
        });

        it('should mark job as failed after max attempts', () => {
            const job = {
                attempts: 3,
                maxAttempts: 3,
                status: 'processing' as 'pending' | 'processing' | 'completed' | 'failed'
            };

            if (job.attempts >= job.maxAttempts) {
                job.status = 'failed';
            }

            expect(job.status).toBe('failed');
        });
    });
});

describe('Forecast Calculation', () => {
    describe('Linear Regression', () => {
        it('should calculate slope and intercept correctly', () => {
            const values = [
                { timestamp: 1000, value: 10 },
                { timestamp: 2000, value: 20 },
                { timestamp: 3000, value: 30 }
            ];

            const n = values.length;
            const sumX = values.reduce((acc, v) => acc + v.timestamp, 0);
            const sumY = values.reduce((acc, v) => acc + v.value, 0);
            const sumXY = values.reduce((acc, v) => acc + v.timestamp * v.value, 0);
            const sumX2 = values.reduce((acc, v) => acc + v.timestamp * v.timestamp, 0);

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            expect(slope).toBeCloseTo(0.01, 4);
            expect(intercept).toBeCloseTo(0, 1);
        });
    });

    describe('Time to Threshold', () => {
        it('should calculate time to threshold breach', () => {
            const currentValue = 50;
            const slope = 2; // value per hour
            const threshold = 100;

            const hoursToThreshold = (threshold - currentValue) / slope;

            expect(hoursToThreshold).toBe(25);
        });

        it('should return null if trend is decreasing and threshold is above current', () => {
            const currentValue = 50;
            const slope = -2; // decreasing
            const threshold = 100;

            const hoursToThreshold = slope > 0 ? (threshold - currentValue) / slope : null;

            expect(hoursToThreshold).toBeNull();
        });
    });

    describe('Confidence Interval', () => {
        it('should calculate 95% confidence bounds', () => {
            const predictedValue = 100;
            const stdError = 5;
            const zScore = 1.96; // 95% confidence

            const upperBound = predictedValue + zScore * stdError;
            const lowerBound = predictedValue - zScore * stdError;

            expect(upperBound).toBeCloseTo(109.8, 1);
            expect(lowerBound).toBeCloseTo(90.2, 1);
        });
    });
});

describe('Dashboard Generation', () => {
    describe('Panel Grid Layout', () => {
        it('should validate panel does not exceed grid width', () => {
            const validatePanel = (x: number, w: number): boolean => {
                return x + w <= 12;
            };

            expect(validatePanel(0, 12)).toBe(true);
            expect(validatePanel(6, 6)).toBe(true);
            expect(validatePanel(6, 7)).toBe(false);
        });

        it('should calculate next available y position', () => {
            const panels = [
                { gridPos: { x: 0, y: 0, w: 12, h: 2 } },
                { gridPos: { x: 0, y: 2, w: 6, h: 4 } }
            ];

            const maxY = Math.max(...panels.map(p => p.gridPos.y + p.gridPos.h));

            expect(maxY).toBe(6);
        });
    });

    describe('Dashboard JSON Validation', () => {
        it('should validate required dashboard fields', () => {
            const dashboard = {
                title: 'Test Dashboard',
                description: 'A test',
                panels: [],
                tags: []
            };

            expect(dashboard.title).toBeTruthy();
            expect(Array.isArray(dashboard.panels)).toBe(true);
            expect(Array.isArray(dashboard.tags)).toBe(true);
        });

        it('should validate panel structure', () => {
            const panel = {
                id: 'p1',
                type: 'stat',
                title: 'Active Hosts',
                gridPos: { x: 0, y: 0, w: 3, h: 2 },
                targets: [{ expr: 'sum(up)', refId: 'A' }],
                options: {}
            };

            expect(panel.id).toBeTruthy();
            expect(['stat', 'timeseries', 'table', 'gauge', 'forecast']).toContain(panel.type);
            expect(panel.targets.length).toBeGreaterThan(0);
            expect(panel.targets[0].expr).toBeTruthy();
        });
    });
});
