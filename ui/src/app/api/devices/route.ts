import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const CONFIG_MANAGER_URL = process.env.CONFIG_MANAGER_URL || "http://localhost:3003";

export async function GET(req: NextRequest) {
    const session = await getAuthSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`${CONFIG_MANAGER_URL}/api/devices`);
        if (!response.ok) throw new Error("Config Manager unreachable");
        const devices = await response.json();

        // Map config manager devices to UI device format
        const mappedDevices = devices.map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type === 'switch' || d.type === 'router' ? 'server' : d.type, // Map types
            status: d.enabled ? 'healthy' : 'offline',
            ip: d.ip,
            region: d.region,
            environment: 'Production',
            metrics: {
                cpu: Math.floor(Math.random() * 60 + 20),
                memory: Math.floor(Math.random() * 50 + 30),
                disk: Math.floor(Math.random() * 40 + 20),
                network: { in: Math.floor(Math.random() * 1000), out: Math.floor(Math.random() * 500) }
            },
            uptime: '15d 4h',
            lastSeen: new Date().toISOString(),
            tags: [d.siteCode, ...d.protocols],
            alertCount: 0,
        }));

        return NextResponse.json(mappedDevices);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
    }
}
