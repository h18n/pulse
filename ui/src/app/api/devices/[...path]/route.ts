/**
 * Device Inventory API Proxy
 * 
 * Proxies requests from the UI to the Config Manager backend service.
 * Endpoints:
 * - GET /api/devices/topology - Full dependency graph
 * - GET /api/devices/impact/:id - Affected nodes analysis
 * - GET /api/devices/regions - List available regions
 * - GET /api/devices/:id - Single device details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

const CONFIG_MANAGER_URL = process.env.CONFIG_MANAGER_URL || 'http://localhost:3003';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const session = await getAuthSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { path } = await params;
        const endpoint = path.join('/');

        const response = await fetch(`${CONFIG_MANAGER_URL}/api/${endpoint}`, {
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
        console.error('[Device Proxy] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Config Manager request failed' },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const session = await getAuthSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { path } = await params;
        const endpoint = path.join('/');
        const body = await req.json();

        const response = await fetch(`${CONFIG_MANAGER_URL}/api/${endpoint}`, {
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
        return NextResponse.json(
            { error: error.message || 'Config Manager request failed' },
            { status: 500 }
        );
    }
}
