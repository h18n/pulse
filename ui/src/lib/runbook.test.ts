import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RunbookEngine, Runbook, getRunbookEngine } from './runbook';

describe('RunbookEngine', () => {
    let engine: RunbookEngine;

    beforeEach(() => {
        engine = new RunbookEngine();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should register, get, and unregister runbooks', () => {
        const rb: Runbook = {
            id: 'test-rb',
            name: 'Test',
            description: 'desc',
            version: '1.0.0',
            enabled: true,
            triggers: [],
            steps: [],
            timeout: 60,
            retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [],
            tags: [],
            owner: 'test',
            lastModified: '',
            createdAt: ''
        };

        engine.registerRunbook(rb);
        expect(engine.getRunbook('test-rb')).toEqual(rb);
        expect(engine.getRunbooks().length).toBe(1);

        engine.updateRunbook('test-rb', { name: 'Updated' });
        expect(engine.getRunbook('test-rb')?.name).toBe('Updated');

        engine.unregisterRunbook('test-rb');
        expect(engine.getRunbook('test-rb')).toBeUndefined();
    });

    it('should throw error executing non-existent or disabled runbook', async () => {
        await expect(engine.executeRunbook('fake-id', 'user', 'manual')).rejects.toThrow('Runbook fake-id not found');

        const rb: Runbook = {
            id: 'disabled-rb',
            name: 'Disabled',
            description: '',
            version: '1.0.0',
            enabled: false,
            triggers: [],
            steps: [],
            timeout: 60,
            retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [],
            tags: [],
            owner: 'test',
            lastModified: '',
            createdAt: ''
        };
        engine.registerRunbook(rb);
        await expect(engine.executeRunbook('disabled-rb', 'user', 'manual')).rejects.toThrow('Runbook disabled-rb is disabled');
    });

    it('should execute runbook steps successfully', async () => {
        const rb: Runbook = {
            id: 'test-exec',
            name: 'Execution Test',
            description: '',
            version: '1.0.0',
            enabled: true,
            triggers: [],
            steps: [
                {
                    id: 's1',
                    name: 'Step 1',
                    type: 'command',
                    config: { type: 'command', command: 'echo', args: ['hello'] },
                    onFailure: 'abort',
                    outputVariable: 'step1Out'
                },
                {
                    id: 's2',
                    name: 'Skip Step',
                    type: 'notification',
                    config: { type: 'notification', channel: 'slack', template: '', recipients: [] },
                    condition: 'false', // Will skip
                    onFailure: 'continue'
                }
            ],
            timeout: 60,
            retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [],
            tags: [],
            owner: 'test',
            lastModified: '',
            createdAt: ''
        };

        engine.registerRunbook(rb);

        const execPromise = engine.executeRunbook('test-exec', 'user', 'manual', { inputVar: 'val' });

        // Advance timers to let command execute
        await vi.advanceTimersByTimeAsync(2000);

        const exec = await execPromise;

        expect(exec.status).toBe('completed');
        expect(exec.steps[0].status).toBe('completed');
        expect(exec.steps[1].status).toBe('skipped');
        expect(exec.variables.step1Out).toBeDefined();
        expect(exec.variables.inputVar).toBe('val');
    });

    it('should handle failures if onFailure is abort', async () => {
        const rb: Runbook = {
            id: 'fail-exec',
            name: 'Failure Test',
            description: '',
            version: '1.0.0',
            enabled: true,
            triggers: [],
            steps: [
                {
                    id: 's1',
                    name: 'Fail Step',
                    type: 'script', // Since it's hard to make the simulated command fail, let's just make it throw
                    config: { type: 'script', language: 'bash', script: '' },
                    onFailure: 'abort'
                }
            ],
            timeout: 60,
            retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [],
            tags: [],
            owner: 'test',
            lastModified: '',
            createdAt: ''
        };

        engine.registerRunbook(rb);

        // Mock executeStep to throw Error
        vi.spyOn(engine as any, 'executeScript').mockRejectedValue(new Error('Script error'));

        const execPromise = engine.executeRunbook('fail-exec', 'system', 'manual');
        const exec = await execPromise;

        expect(exec.status).toBe('failed');
        expect(exec.error).toContain('Script error');
    });

    it('should handle approval steps', async () => {
        const rb: Runbook = {
            id: 'approval-rb', name: 'Approval', description: '', version: '1.0', enabled: true,
            triggers: [], timeout: 60, retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [], tags: [], owner: 't', lastModified: '', createdAt: '',
            steps: [{
                id: 's1', name: 'Approve', type: 'approval',
                config: { type: 'approval', approvers: ['admin'], message: 'Wait', timeout: 30 },
                onFailure: 'abort'
            }]
        };
        engine.registerRunbook(rb);

        const execPromise = engine.executeRunbook('approval-rb', 'user', 'manual');
        // Let it run to the approval point
        await vi.advanceTimersByTimeAsync(100);

        const execs = engine.getExecutions();
        expect(execs.length).toBeGreaterThan(0);
        const exec = execs.find(e => e.runbookId === 'approval-rb')!;

        // Approve it
        engine.approveExecution(exec.id, 'admin');

        // Wait for it to finish simulation
        await vi.advanceTimersByTimeAsync(3000);

        const finalExec = engine.getExecution(exec.id);
        expect(finalExec?.status).toBe('completed');
    });

    it('should handle cancel execution', async () => {
        const rb: Runbook = {
            id: 'cancel-rb', name: 'Cancel', description: '', version: '1.0', enabled: true,
            triggers: [], timeout: 60, retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [], tags: [], owner: 't', lastModified: '', createdAt: '',
            steps: [{ id: 's1', name: 'Wait', type: 'wait', config: { type: 'wait', duration: 10 }, onFailure: 'abort' }]
        };
        engine.registerRunbook(rb);

        const execPromise = engine.executeRunbook('cancel-rb', 'user', 'manual');
        await vi.advanceTimersByTimeAsync(100);

        const exec = engine.getExecutions().find(e => e.runbookId === 'cancel-rb')!;
        engine.cancelExecution(exec.id);

        expect(engine.getExecution(exec.id)?.status).toBe('cancelled');
    });

    it('should cover additional step types and edge cases', async () => {
        const rb: Runbook = {
            id: 'misc-rb', name: 'Misc', description: '', version: '1.0', enabled: true,
            triggers: [], timeout: 60, retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 1 },
            notifications: [], tags: [], owner: 't', lastModified: '', createdAt: '',
            steps: [
                { id: 's1', name: 'API', type: 'api_call', config: { type: 'api_call', method: 'GET', url: 'http://h' }, onFailure: 'continue' },
                { id: 's2', name: 'Wait', type: 'wait', config: { type: 'wait', duration: 1 }, onFailure: 'continue' },
                { id: 's3', name: 'Notify', type: 'notification', config: { type: 'notification', channel: 'email', template: 't', recipients: ['r'] }, onFailure: 'continue' },
                { id: 's4', name: 'Bad Condition', type: 'command', config: { type: 'command', command: 'ls' }, condition: 'syntax...error', onFailure: 'continue' },
                { id: 's5', name: 'Unknown', type: 'parallel', config: { type: 'parallel' as any, steps: [], waitAll: true }, onFailure: 'continue' }
            ]
        };
        engine.registerRunbook(rb);

        const execPromise = engine.executeRunbook('misc-rb', 'user', 'manual');
        await vi.advanceTimersByTimeAsync(15000);
        const exec = await execPromise;

        expect(exec.status).toBe('completed');
        // s4 should be skipped because of syntax error in evaluation (returns false)
        expect(exec.steps.find(s => s.stepId === 's4')?.status).toBe('skipped');
    });

    it('should initialize default runbooks', () => {
        const defaultEngine = getRunbookEngine();
        expect(defaultEngine.getRunbooks().length).toBeGreaterThan(0);
    });
});
