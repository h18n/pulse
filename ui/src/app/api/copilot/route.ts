import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:3002";

export async function POST(req: NextRequest) {
    const session = await getAuthSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { question, alertFingerprint, action } = body;

        let endpoint = "/api/query";
        let method = "POST";
        let payload: any = { question };

        if (action === "rca") {
            endpoint = "/api/rca";
            payload = { alertFingerprint };
        } else if (action === "trends") {
            endpoint = "/api/trends";
            method = "GET";
            payload = {}; // Trends uses query params which we can handle if needed
        }

        const response = await fetch(`${AI_ENGINE_URL}${endpoint}`, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: method === "POST" ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "AI Engine request failed");
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Copilot API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "AI Engine unavailable" },
            { status: 500 }
        );
    }
}
