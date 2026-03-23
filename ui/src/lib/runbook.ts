/**
 * Runbook Automation Engine
 * 
 * Enables automated incident response through definable runbooks.
 * Supports:
 * - Step-by-step execution
 * - Conditional branching
 * - Manual approvals
 * - Integration with external systems
 * - Execution history and audit logs
 */

import { EventEmitter } from 'events';

// Runbook types
export interface Runbook {
    id: string;
    name: string;
    description: string;
    version: string;
    enabled: boolean;

    // Trigger conditions
    triggers: RunbookTrigger[];

    // Steps
    steps: RunbookStep[];

    // Configuration
    timeout: number; // seconds
    retryPolicy: RetryPolicy;
    notifications: NotificationConfig[];

    // Metadata
    tags: string[];
    owner: string;
    lastModified: string;
    createdAt: string;
}

export interface RunbookTrigger {
    type: 'alert' | 'schedule' | 'manual' | 'webhook' | 'correlation';
    config: {
        alertRuleId?: string;
        correlationRuleId?: string;
        schedule?: string; // cron expression
        webhookSecret?: string;
    };
}

export interface RetryPolicy {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number; // seconds
}

export interface NotificationConfig {
    channel: 'email' | 'slack' | 'pagerduty' | 'webhook';
    events: ('start' | 'complete' | 'error' | 'approval')[];
    config: Record<string, unknown>;
}

// Step types
export type StepType =
    | 'command'
    | 'script'
    | 'api_call'
    | 'condition'
    | 'approval'
    | 'notification'
    | 'wait'
    | 'parallel'
    | 'loop';

export interface RunbookStep {
    id: string;
    name: string;
    type: StepType;
    description?: string;

    // Execution config
    config: StepConfig;

    // Conditional
    condition?: string; // JavaScript expression

    // On failure
    onFailure: 'continue' | 'abort' | 'retry' | 'goto';
    failureTarget?: string; // step id for goto

    // Timeout
    timeout?: number;

    // Output mapping
    outputVariable?: string;
}

export type StepConfig =
    | CommandStepConfig
    | ScriptStepConfig
    | ApiCallStepConfig
    | ConditionStepConfig
    | ApprovalStepConfig
    | NotificationStepConfig
    | WaitStepConfig
    | ParallelStepConfig
    | LoopStepConfig;

export interface CommandStepConfig {
    type: 'command';
    command: string;
    args?: string[];
    workingDir?: string;
    env?: Record<string, string>;
}

export interface ScriptStepConfig {
    type: 'script';
    language: 'bash' | 'python' | 'javascript';
    script: string;
}

export interface ApiCallStepConfig {
    type: 'api_call';
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
    auth?: { type: 'basic' | 'bearer' | 'api_key'; credentials: string };
}

export interface ConditionStepConfig {
    type: 'condition';
    expression: string;
    trueSteps: string[];
    falseSteps: string[];
}

export interface ApprovalStepConfig {
    type: 'approval';
    approvers: string[];
    message: string;
    timeout: number; // seconds
    autoApprove?: boolean;
}

export interface NotificationStepConfig {
    type: 'notification';
    channel: 'email' | 'slack' | 'pagerduty';
    template: string;
    recipients: string[];
}

export interface WaitStepConfig {
    type: 'wait';
    duration: number; // seconds
    condition?: string; // wait until condition
}

export interface ParallelStepConfig {
    type: 'parallel';
    steps: string[];
    waitAll: boolean;
}

export interface LoopStepConfig {
    type: 'loop';
    items: string; // variable name containing array
    steps: string[];
    maxIterations: number;
}

// Execution types
export interface RunbookExecution {
    id: string;
    runbookId: string;
    runbookName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting_approval';
    startTime: Date;
    endTime?: Date;
    triggeredBy: string;
    triggerType: RunbookTrigger['type'];

    // Step executions
    steps: StepExecution[];

    // Context
    variables: Record<string, unknown>;

    // Error
    error?: string;
}

export interface StepExecution {
    stepId: string;
    stepName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting';
    startTime?: Date;
    endTime?: Date;
    output?: unknown;
    error?: string;
    retries: number;
}

/**
 * Runbook Automation Engine
 */
export class RunbookEngine extends EventEmitter {
    private runbooks: Map<string, Runbook> = new Map();
    private executions: Map<string, RunbookExecution> = new Map();

    constructor() {
        super();
    }

    /**
     * Register a runbook
     */
    registerRunbook(runbook: Runbook): void {
        this.runbooks.set(runbook.id, runbook);
        this.emit('runbookRegistered', runbook);
    }

    /**
     * Unregister a runbook
     */
    unregisterRunbook(runbookId: string): void {
        this.runbooks.delete(runbookId);
        this.emit('runbookUnregistered', runbookId);
    }

    /**
     * Get all runbooks
     */
    getRunbooks(): Runbook[] {
        return Array.from(this.runbooks.values());
    }

    /**
     * Get runbook by ID
     */
    getRunbook(runbookId: string): Runbook | undefined {
        return this.runbooks.get(runbookId);
    }

    /**
     * Update a runbook
     */
    updateRunbook(runbookId: string, updates: Partial<Runbook>): void {
        const runbook = this.runbooks.get(runbookId);
        if (runbook) {
            this.runbooks.set(runbookId, { ...runbook, ...updates, lastModified: new Date().toISOString() });
            this.emit('runbookUpdated', this.runbooks.get(runbookId));
        }
    }

    /**
     * Execute a runbook
     */
    async executeRunbook(runbookId: string, triggeredBy: string, triggerType: RunbookTrigger['type'], context: Record<string, unknown> = {}): Promise<RunbookExecution> {
        const runbook = this.runbooks.get(runbookId);
        if (!runbook) {
            throw new Error(`Runbook ${runbookId} not found`);
        }

        if (!runbook.enabled) {
            throw new Error(`Runbook ${runbookId} is disabled`);
        }

        // Create execution
        const execution: RunbookExecution = {
            id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            runbookId,
            runbookName: runbook.name,
            status: 'pending',
            startTime: new Date(),
            triggeredBy,
            triggerType,
            steps: runbook.steps.map(step => ({
                stepId: step.id,
                stepName: step.name,
                status: 'pending',
                retries: 0,
            })),
            variables: { ...context },
        };

        this.executions.set(execution.id, execution);
        this.emit('executionStarted', execution);

        // Execute steps
        try {
            execution.status = 'running';

            for (const step of runbook.steps) {
                const stepExecution = execution.steps.find(s => s.stepId === step.id);
                if (!stepExecution) continue;

                // Check condition
                if (step.condition && !this.evaluateCondition(step.condition, execution.variables)) {
                    stepExecution.status = 'skipped';
                    continue;
                }

                // Execute step
                await this.executeStep(step, stepExecution, execution);

                // Check for failure
                if (stepExecution.status === 'failed' && step.onFailure === 'abort') {
                    throw new Error(`Step ${step.name} failed: ${stepExecution.error}`);
                }
            }

            execution.status = 'completed';
            execution.endTime = new Date();
            this.emit('executionCompleted', execution);

        } catch (error) {
            execution.status = 'failed';
            execution.error = error instanceof Error ? error.message : 'Unknown error';
            execution.endTime = new Date();
            this.emit('executionFailed', execution);
        }

        return execution;
    }

    /**
     * Execute a single step
     */
    private async executeStep(step: RunbookStep, stepExecution: StepExecution, execution: RunbookExecution): Promise<void> {
        stepExecution.status = 'running';
        stepExecution.startTime = new Date();
        this.emit('stepStarted', { execution, step: stepExecution });

        try {
            let output: unknown;

            // Simulate step execution based on type
            switch ((step.config as { type: string }).type) {
                case 'command':
                    output = await this.executeCommand(step.config as CommandStepConfig, execution.variables);
                    break;
                case 'script':
                    output = await this.executeScript(step.config as ScriptStepConfig, execution.variables);
                    break;
                case 'api_call':
                    output = await this.executeApiCall(step.config as ApiCallStepConfig, execution.variables);
                    break;
                case 'approval':
                    output = await this.handleApproval(step.config as ApprovalStepConfig, execution);
                    break;
                case 'wait':
                    output = await this.handleWait(step.config as WaitStepConfig);
                    break;
                case 'notification':
                    output = await this.sendNotification(step.config as NotificationStepConfig, execution.variables);
                    break;
                default:
                    output = { status: 'simulated' };
            }

            stepExecution.status = 'completed';
            stepExecution.output = output;
            stepExecution.endTime = new Date();

            // Store output in variables
            if (step.outputVariable) {
                execution.variables[step.outputVariable] = output;
            }

            this.emit('stepCompleted', { execution, step: stepExecution });

        } catch (error) {
            stepExecution.status = 'failed';
            stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
            stepExecution.endTime = new Date();
            this.emit('stepFailed', { execution, step: stepExecution });
        }
    }

    /**
     * Execute command (simulated)
     */
    private async executeCommand(config: CommandStepConfig, variables: Record<string, unknown>): Promise<unknown> {
        // Simulate command execution
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            exitCode: 0,
            stdout: `Executed: ${config.command} ${config.args?.join(' ') || ''}`,
            stderr: '',
        };
    }

    /**
     * Execute script (simulated)
     */
    private async executeScript(config: ScriptStepConfig, variables: Record<string, unknown>): Promise<unknown> {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            exitCode: 0,
            output: `Script executed (${config.language})`,
        };
    }

    /**
     * Execute API call (simulated)
     */
    private async executeApiCall(config: ApiCallStepConfig, variables: Record<string, unknown>): Promise<unknown> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            status: 200,
            body: { success: true, message: 'API call simulated' },
        };
    }

    /**
     * Handle approval step
     */
    private async handleApproval(config: ApprovalStepConfig, execution: RunbookExecution): Promise<unknown> {
        if (config.autoApprove) {
            return { approved: true, approver: 'system', timestamp: new Date() };
        }

        // In real implementation, this would wait for manual approval
        execution.status = 'waiting_approval';
        this.emit('approvalRequired', { execution, approvers: config.approvers, message: config.message });

        // Simulate auto-approval after delay for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        execution.status = 'running';

        return { approved: true, approver: 'demo-user', timestamp: new Date() };
    }

    /**
     * Handle wait step
     */
    private async handleWait(config: WaitStepConfig): Promise<unknown> {
        await new Promise(resolve => setTimeout(resolve, Math.min(config.duration * 1000, 5000)));
        return { waited: config.duration };
    }

    /**
     * Send notification (simulated)
     */
    private async sendNotification(config: NotificationStepConfig, variables: Record<string, unknown>): Promise<unknown> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            sent: true,
            channel: config.channel,
            recipients: config.recipients,
        };
    }

    /**
     * Evaluate condition
     */
    private evaluateCondition(expression: string, variables: Record<string, unknown>): boolean {
        try {
            // Simple evaluation (in production, use a proper sandbox)
            const fn = new Function(...Object.keys(variables), `return ${expression}`);
            return Boolean(fn(...Object.values(variables)));
        } catch {
            return false;
        }
    }

    /**
     * Approve an execution waiting for approval
     */
    approveExecution(executionId: string, approver: string): void {
        const execution = this.executions.get(executionId);
        if (execution && execution.status === 'waiting_approval') {
            execution.variables['approval'] = { approved: true, approver, timestamp: new Date() };
            this.emit('executionApproved', { execution, approver });
        }
    }

    /**
     * Cancel an execution
     */
    cancelExecution(executionId: string): void {
        const execution = this.executions.get(executionId);
        if (execution && ['pending', 'running', 'waiting_approval'].includes(execution.status)) {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            this.emit('executionCancelled', execution);
        }
    }

    /**
     * Get all executions
     */
    getExecutions(): RunbookExecution[] {
        return Array.from(this.executions.values());
    }

    /**
     * Get execution by ID
     */
    getExecution(executionId: string): RunbookExecution | undefined {
        return this.executions.get(executionId);
    }
}

// Singleton instance
let runbookEngine: RunbookEngine | null = null;

export function getRunbookEngine(): RunbookEngine {
    if (!runbookEngine) {
        runbookEngine = new RunbookEngine();
        initializeDefaultRunbooks(runbookEngine);
    }
    return runbookEngine;
}

/**
 * Initialize with default runbooks
 */
function initializeDefaultRunbooks(engine: RunbookEngine): void {
    // Host Isolation Runbook
    engine.registerRunbook({
        id: 'rb-isolate-host',
        name: 'Isolate Compromised Host',
        description: 'Automatically isolates a potentially compromised host from the network',
        version: '1.0.0',
        enabled: true,
        triggers: [
            { type: 'correlation', config: { correlationRuleId: 'rule-lateral-movement' } },
            { type: 'manual', config: {} },
        ],
        steps: [
            {
                id: 'step-1',
                name: 'Gather Host Information',
                type: 'api_call',
                config: { type: 'api_call', method: 'GET', url: '/api/hosts/${hostId}' },
                onFailure: 'abort',
                outputVariable: 'hostInfo',
            },
            {
                id: 'step-2',
                name: 'Notify Security Team',
                type: 'notification',
                config: { type: 'notification', channel: 'slack', template: 'host_isolation', recipients: ['#security-alerts'] },
                onFailure: 'continue',
            },
            {
                id: 'step-3',
                name: 'Request Approval',
                type: 'approval',
                config: { type: 'approval', approvers: ['security-team'], message: 'Approve host isolation?', timeout: 300, autoApprove: false },
                onFailure: 'abort',
            },
            {
                id: 'step-4',
                name: 'Disable Network Access',
                type: 'command',
                config: { type: 'command', command: 'firewall-cmd', args: ['--add-rich-rule', 'rule family="ipv4" source address="${hostIp}" reject'] },
                onFailure: 'retry',
                condition: 'approval.approved === true',
            },
            {
                id: 'step-5',
                name: 'Create Incident Ticket',
                type: 'api_call',
                config: { type: 'api_call', method: 'POST', url: '/api/incidents', body: { title: 'Host Isolation', severity: 'high' } },
                onFailure: 'continue',
                outputVariable: 'incident',
            },
        ],
        timeout: 600,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelay: 5 },
        notifications: [
            { channel: 'slack', events: ['start', 'complete', 'error'], config: { channel: '#security-automation' } },
        ],
        tags: ['security', 'isolation', 'automated-response'],
        owner: 'security-team',
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    });

    // Credential Reset Runbook
    engine.registerRunbook({
        id: 'rb-credential-reset',
        name: 'Force Credential Reset',
        description: 'Forces password reset for compromised user accounts',
        version: '1.0.0',
        enabled: true,
        triggers: [
            { type: 'correlation', config: { correlationRuleId: 'rule-brute-force' } },
            { type: 'manual', config: {} },
        ],
        steps: [
            {
                id: 'step-1',
                name: 'Get User Details',
                type: 'api_call',
                config: { type: 'api_call', method: 'GET', url: '/api/users/${userId}' },
                onFailure: 'abort',
                outputVariable: 'user',
            },
            {
                id: 'step-2',
                name: 'Disable User Account',
                type: 'api_call',
                config: { type: 'api_call', method: 'PATCH', url: '/api/users/${userId}', body: { enabled: false } },
                onFailure: 'abort',
            },
            {
                id: 'step-3',
                name: 'Revoke Active Sessions',
                type: 'api_call',
                config: { type: 'api_call', method: 'DELETE', url: '/api/users/${userId}/sessions' },
                onFailure: 'continue',
            },
            {
                id: 'step-4',
                name: 'Send Reset Email',
                type: 'notification',
                config: { type: 'notification', channel: 'email', template: 'password_reset', recipients: ['${user.email}'] },
                onFailure: 'continue',
            },
            {
                id: 'step-5',
                name: 'Notify Security',
                type: 'notification',
                config: { type: 'notification', channel: 'slack', template: 'credential_reset', recipients: ['#security-alerts'] },
                onFailure: 'continue',
            },
        ],
        timeout: 300,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 2, initialDelay: 3 },
        notifications: [
            { channel: 'email', events: ['complete', 'error'], config: { recipients: ['security@company.com'] } },
        ],
        tags: ['security', 'credentials', 'account-management'],
        owner: 'identity-team',
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    });

    // System Health Check Runbook
    engine.registerRunbook({
        id: 'rb-health-check',
        name: 'System Health Check',
        description: 'Performs automated health checks on critical systems',
        version: '1.0.0',
        enabled: true,
        triggers: [
            { type: 'schedule', config: { schedule: '0 */15 * * * *' } },
            { type: 'manual', config: {} },
        ],
        steps: [
            {
                id: 'step-1',
                name: 'Check API Health',
                type: 'api_call',
                config: { type: 'api_call', method: 'GET', url: '/api/health' },
                onFailure: 'continue',
                outputVariable: 'apiHealth',
            },
            {
                id: 'step-2',
                name: 'Check Database Connectivity',
                type: 'command',
                config: { type: 'command', command: 'pg_isready', args: ['-h', 'db.local'] },
                onFailure: 'continue',
                outputVariable: 'dbHealth',
            },
            {
                id: 'step-3',
                name: 'Check Redis Connectivity',
                type: 'command',
                config: { type: 'command', command: 'redis-cli', args: ['ping'] },
                onFailure: 'continue',
                outputVariable: 'redisHealth',
            },
            {
                id: 'step-4',
                name: 'Report Health Status',
                type: 'notification',
                config: { type: 'notification', channel: 'slack', template: 'health_report', recipients: ['#ops-status'] },
                onFailure: 'abort',
                condition: 'apiHealth.status !== 200 || dbHealth.exitCode !== 0',
            },
        ],
        timeout: 120,
        retryPolicy: { maxRetries: 1, backoffMultiplier: 1, initialDelay: 5 },
        notifications: [],
        tags: ['operations', 'health-check', 'monitoring'],
        owner: 'ops-team',
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    });
}

export default RunbookEngine;
