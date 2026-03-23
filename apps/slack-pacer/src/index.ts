import { App, LogLevel } from '@slack/bolt';
import pino from 'pino';

const logger = pino({
    transport: { target: 'pino-pretty', options: { colorize: true } }
});

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:3002';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    logLevel: LogLevel.INFO
});

// Helper to call AI Engine
async function queryAI(question: string): Promise<any> {
    const response = await fetch(`${AI_ENGINE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
    });
    return response.json();
}

async function getTrends(hours: number = 24, siteCode?: string): Promise<any> {
    const params = new URLSearchParams({ hours: hours.toString() });
    if (siteCode) params.append('siteCode', siteCode);

    const response = await fetch(`${AI_ENGINE_URL}/api/trends?${params}`);
    return response.json();
}

async function getRCA(fingerprint: string): Promise<any> {
    const response = await fetch(`${AI_ENGINE_URL}/api/rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertFingerprint: fingerprint })
    });
    return response.json();
}

// Respond to mentions
app.event('app_mention', async ({ event, say }) => {
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

    logger.info(`Received question: ${text}`);

    try {
        await say({
            text: '🤔 Analyzing your question...',
            thread_ts: event.ts
        });

        const result = await queryAI(text);

        await say({
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*🧠 AI Analysis:*\n\n${result.answer}`
                    }
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `_Analyzed ${result.alertsAnalyzed} alerts | Generated at ${result.generatedAt}_`
                        }
                    ]
                }
            ],
            thread_ts: event.ts
        });
    } catch (err: any) {
        logger.error(`Error: ${err.message}`);
        await say({
            text: `❌ Error processing your request: ${err.message}`,
            thread_ts: event.ts
        });
    }
});

// Slash command: /pulse-trends
app.command('/pulse-trends', async ({ command, ack, respond }) => {
    await ack();

    const args = command.text.split(' ');
    const hours = parseInt(args[0]) || 24;
    const siteCode = args[1];

    try {
        const trends = await getTrends(hours, siteCode);

        const severityText = trends.bySeverity
            .map((b: any) => `• *${b.key}*: ${b.doc_count}`)
            .join('\n');

        const statusText = trends.byStatus
            .map((b: any) => `• *${b.key}*: ${b.doc_count}`)
            .join('\n');

        await respond({
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `📊 Alert Trends (Last ${hours}h)${siteCode ? ` - ${siteCode}` : ''}`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*By Severity:*\n${severityText || 'No data'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*By Status:*\n${statusText || 'No data'}`
                        }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Total Alerts:* ${typeof trends.totalAlerts === 'object' ? trends.totalAlerts.value : trends.totalAlerts}`
                    }
                }
            ]
        });
    } catch (err: any) {
        await respond(`❌ Error fetching trends: ${err.message}`);
    }
});

// Slash command: /pulse-rca
app.command('/pulse-rca', async ({ command, ack, respond }) => {
    await ack();

    const fingerprint = command.text.trim();
    if (!fingerprint) {
        await respond('Please provide an alert fingerprint. Usage: `/pulse-rca <fingerprint>`');
        return;
    }

    try {
        await respond('🔍 Running Root Cause Analysis...');

        const rca = await getRCA(fingerprint);

        const remediationSteps = rca.analysis.remediation
            ?.map((step: string, i: number) => `${i + 1}. ${step}`)
            .join('\n') || 'No remediation steps';

        await respond({
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🔬 Root Cause Analysis'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Alert:* ${rca.alert.summary}\n*Severity:* ${rca.alert.severity}`
                    }
                },
                {
                    type: 'divider'
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*🎯 Root Cause:*\n${rca.analysis.rootCause || 'Unknown'}`
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*🛠️ Remediation Steps:*\n${remediationSteps}`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Impact Score:* ${rca.analysis.impactScore || 'N/A'}/10`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Confidence:* ${rca.analysis.confidence ? `${(rca.analysis.confidence * 100).toFixed(0)}%` : 'N/A'}`
                        }
                    ]
                }
            ]
        });
    } catch (err: any) {
        await respond(`❌ Error running RCA: ${err.message}`);
    }
});

// Interactive button for quick actions
app.action('view_alert_details', async ({ ack, body, client }) => {
    await ack();
    // Handle view details button
    logger.info('View alert details clicked');
});

(async () => {
    try {
        await app.start();
        logger.info('⚡️ Slack Pacer Bot is running!');
    } catch (err: any) {
        logger.error(`Failed to start: ${err.message}`);
    }
})();
