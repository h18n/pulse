/**
 * AI Engine API Proxy
 * 
 * Proxies requests from the UI to the AI Engine backend service.
 * Endpoints:
 * - POST /api/ai-engine/forecast - Predictive forecasting
 * - POST /api/ai-engine/generate-dashboard - NL dashboard generation
 * - POST /api/ai-engine/rca - Root cause analysis
 * - POST /api/ai-engine/query - Natural language query
 */

import { NextRequest, NextResponse } from 'next/server';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:3002';

// Handle all POST requests
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const endpoint = path.join('/');
        const body = await req.json();

        const response = await fetch(`${AI_ENGINE_URL}/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[AI Engine Proxy] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'AI Engine request failed' },
            { status: 500 }
        );
    }
}

// Handle GET requests (e.g., /api/ai-engine/arca/status)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const endpoint = path.join('/');
        const searchParams = req.nextUrl.searchParams.toString();
        const queryString = searchParams ? `?${searchParams}` : '';

        const response = await fetch(`${AI_ENGINE_URL}/api/${endpoint}${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[AI Engine Proxy] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'AI Engine request failed' },
            { status: 500 }
        );
    }
}
