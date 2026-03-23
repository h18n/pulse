/**
 * Collaboration Service
 * 
 * Manages contextual comments and @mentions for widgets and alerts.
 * Stores data in Elasticsearch for fast retrieval and persistence.
 * 
 * @module services/collaboration
 */

import { Client } from '@elastic/elasticsearch';
import { pino } from 'pino';

const logger = pino({
    transport: { target: 'pino-pretty', options: { colorize: true } }
});

// ============== Types ==============

export interface Comment {
    id: string;
    resourceId: string; // widgetId or alertFingerprint
    resourceType: 'widget' | 'alert' | 'incident';
    userId: string;
    userName: string;
    text: string;
    mentions: string[];
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}

// ============== Configuration ==============

const INDEX_COMMENTS = 'pulse-comments';

// ============== Service Implementation ==============

export class CollaborationService {
    private esClient: Client;

    constructor(esClient: Client) {
        this.esClient = esClient;
    }

    /**
     * Initialize Elasticsearch index
     */
    async initIndex() {
        try {
            const exists = await this.esClient.indices.exists({ index: INDEX_COMMENTS });
            if (!exists) {
                await this.esClient.indices.create({
                    index: INDEX_COMMENTS,
                    mappings: {
                        properties: {
                            resourceId: { type: 'keyword' },
                            resourceType: { type: 'keyword' },
                            userId: { type: 'keyword' },
                            userName: { type: 'text' },
                            text: { type: 'text' },
                            mentions: { type: 'keyword' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' }
                        }
                    }
                });
                logger.info(`[Collaboration] Created index: ${INDEX_COMMENTS}`);
            }
        } catch (err: any) {
            logger.error(`[Collaboration] Failed to init index: ${err.message}`);
        }
    }

    /**
     * Add a comment
     */
    async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
        const id = `comm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const now = new Date().toISOString();

        const fullComment: Comment = {
            ...comment,
            id,
            createdAt: now,
            updatedAt: now
        };

        await this.esClient.index({
            index: INDEX_COMMENTS,
            id,
            document: fullComment,
            refresh: 'wait_for'
        });

        logger.info(`[Collaboration] Added comment: ${id} for ${comment.resourceId}`);
        return fullComment;
    }

    /**
     * Get comments for a resource
     */
    async getComments(resourceId: string): Promise<Comment[]> {
        const response = await this.esClient.search({
            index: INDEX_COMMENTS,
            query: { term: { resourceId } },
            sort: [{ createdAt: 'asc' }],
            size: 100
        });

        return response.hits.hits.map((hit: any) => hit._source as Comment);
    }

    /**
     * Delete a comment
     */
    async deleteComment(id: string): Promise<void> {
        await this.esClient.delete({
            index: INDEX_COMMENTS,
            id
        });
        logger.info(`[Collaboration] Deleted comment: ${id}`);
    }
}

export default CollaborationService;
