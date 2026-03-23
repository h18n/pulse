/**
 * In-Memory Job Queue for ARCA Processing
 * 
 * This is a lightweight job queue for development/small deployments.
 * For production at scale, replace with BullMQ + Redis.
 * 
 * @module services/job-queue
 */

import { pino } from 'pino';

const logger = pino({

    transport: { target: 'pino-pretty', options: { colorize: true } }
});

// ============== Types ==============

export interface Job<T = any> {
    id: string;
    name: string;
    data: T;
    priority: number;
    attempts: number;
    maxAttempts: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    error?: string;
    result?: any;
}

export type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;

// ============== Configuration ==============

const CONFIG = {
    MAX_CONCURRENT_JOBS: 3,
    DEFAULT_MAX_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000,
    POLL_INTERVAL_MS: 500,
    JOB_TIMEOUT_MS: 60000,
};

// ============== Job Queue ==============

export class JobQueue {
    private queues: Map<string, Job[]> = new Map();
    private processors: Map<string, JobProcessor> = new Map();
    private activeJobs: Map<string, Job> = new Map();
    private isProcessing: boolean = false;
    private pollInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startProcessing();
    }

    /**
     * Register a job processor for a queue
     */
    process<T>(queueName: string, processor: JobProcessor<T>): void {
        this.processors.set(queueName, processor);
        if (!this.queues.has(queueName)) {
            this.queues.set(queueName, []);
        }
        logger.info(`[JobQueue] Registered processor for queue: ${queueName}`);
    }

    /**
     * Add a job to a queue
     */
    add<T>(queueName: string, data: T, options?: {
        priority?: number;
        maxAttempts?: number;
        jobId?: string;
    }): Job<T> {
        const queue = this.queues.get(queueName) || [];

        // Check for duplicate job
        const existingJob = queue.find(j => j.id === options?.jobId);
        if (existingJob && existingJob.status === 'pending') {
            logger.debug(`[JobQueue] Job ${options?.jobId} already in queue, skipping`);
            return existingJob as Job<T>;
        }

        const job: Job<T> = {
            id: options?.jobId || `${queueName}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: queueName,
            data,
            priority: options?.priority || 0,
            attempts: 0,
            maxAttempts: options?.maxAttempts || CONFIG.DEFAULT_MAX_ATTEMPTS,
            status: 'pending',
            createdAt: new Date(),
        };

        queue.push(job);

        // Sort by priority (higher = more urgent)
        queue.sort((a, b) => b.priority - a.priority);

        this.queues.set(queueName, queue);
        logger.info(`[JobQueue] Added job ${job.id} to queue ${queueName}`);

        return job;
    }

    /**
     * Get queue statistics
     */
    getStats(): Record<string, { pending: number; processing: number; completed: number; failed: number }> {
        const stats: Record<string, any> = {};

        for (const [name, queue] of this.queues.entries()) {
            stats[name] = {
                pending: queue.filter(j => j.status === 'pending').length,
                processing: queue.filter(j => j.status === 'processing').length,
                completed: queue.filter(j => j.status === 'completed').length,
                failed: queue.filter(j => j.status === 'failed').length,
            };
        }

        return stats;
    }

    /**
     * Start the job processing loop
     */
    private startProcessing(): void {
        if (this.pollInterval) return;

        this.pollInterval = setInterval(() => {
            this.processNextJobs();
        }, CONFIG.POLL_INTERVAL_MS);

        logger.info('[JobQueue] Started job processing loop');
    }

    /**
     * Process pending jobs
     */
    private async processNextJobs(): Promise<void> {
        if (this.activeJobs.size >= CONFIG.MAX_CONCURRENT_JOBS) return;

        for (const [queueName, queue] of this.queues.entries()) {
            const processor = this.processors.get(queueName);
            if (!processor) continue;

            const pendingJobs = queue.filter(j => j.status === 'pending');
            const slotsAvailable = CONFIG.MAX_CONCURRENT_JOBS - this.activeJobs.size;

            for (let i = 0; i < Math.min(pendingJobs.length, slotsAvailable); i++) {
                const job = pendingJobs[i];
                this.executeJob(job, processor);
            }
        }
    }

    /**
     * Execute a single job
     */
    private async executeJob(job: Job, processor: JobProcessor): Promise<void> {
        job.status = 'processing';
        job.processedAt = new Date();
        job.attempts++;
        this.activeJobs.set(job.id, job);

        logger.info(`[JobQueue] Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Job timeout')), CONFIG.JOB_TIMEOUT_MS);
            });

            // Race between job execution and timeout
            job.result = await Promise.race([
                processor(job),
                timeoutPromise
            ]);

            job.status = 'completed';
            job.completedAt = new Date();
            logger.info(`[JobQueue] Job ${job.id} completed successfully`);

        } catch (err: any) {
            logger.error(`[JobQueue] Job ${job.id} failed: ${err.message}`);
            job.error = err.message;

            if (job.attempts < job.maxAttempts) {
                // Retry with delay
                job.status = 'pending';
                logger.info(`[JobQueue] Job ${job.id} will retry in ${CONFIG.RETRY_DELAY_MS}ms`);

                setTimeout(() => {
                    // Move to front of queue for retry
                    const queue = this.queues.get(job.name) || [];
                    const idx = queue.indexOf(job);
                    if (idx > 0) {
                        queue.splice(idx, 1);
                        queue.unshift(job);
                    }
                }, CONFIG.RETRY_DELAY_MS);
            } else {
                job.status = 'failed';
                logger.error(`[JobQueue] Job ${job.id} permanently failed after ${job.maxAttempts} attempts`);
            }
        } finally {
            this.activeJobs.delete(job.id);
        }
    }

    /**
     * Stop the processing loop
     */
    stop(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            logger.info('[JobQueue] Stopped job processing loop');
        }
    }

    /**
     * Clear all completed/failed jobs from a queue
     */
    cleanup(queueName: string): number {
        const queue = this.queues.get(queueName) || [];
        const beforeCount = queue.length;
        const activeJobs = queue.filter(j => j.status === 'pending' || j.status === 'processing');
        this.queues.set(queueName, activeJobs);
        return beforeCount - activeJobs.length;
    }
}

// Singleton instance
export const jobQueue = new JobQueue();

export default jobQueue;
