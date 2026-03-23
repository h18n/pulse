import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDataSource, getDefaultDataSource, DataQueryRequest } from "@/lib/datasources";

// POST /api/query - Execute data source query
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        const {
            datasource,
            targets,
            range,
            maxDataPoints = 1000,
            intervalMs = 15000,
            scopedVars = {},
        } = body as {
            datasource?: { type: string; uid: string };
            targets: Array<{ refId: string; expr?: string; query?: string; legendFormat?: string }>;
            range: { from: string; to: string };
            maxDataPoints?: number;
            intervalMs?: number;
            scopedVars?: Record<string, { value: string }>;
        };

        // Get data source
        const ds = datasource?.uid
            ? getDataSource(datasource.uid)
            : getDefaultDataSource();

        if (!ds) {
            return NextResponse.json(
                { error: "Data source not found" },
                { status: 404 }
            );
        }

        // Build query request
        const request: DataQueryRequest = {
            targets,
            range,
            maxDataPoints,
            intervalMs,
            scopedVars,
        };

        // Execute query
        const result = await ds.query(request);

        if (result.error) {
            return NextResponse.json(
                { error: result.error, data: [] },
                { status: 400 }
            );
        }

        return NextResponse.json({
            data: result.data,
            datasource: {
                id: ds.id,
                type: ds.type,
                name: ds.name,
            },
        });
    } catch (error) {
        console.error("Query error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Query failed" },
            { status: 500 }
        );
    }
}

// GET /api/query/test - Test data source connection
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dsId = req.nextUrl.searchParams.get("datasource");
    const ds = dsId ? getDataSource(dsId) : getDefaultDataSource();

    if (!ds) {
        return NextResponse.json(
            { error: "Data source not found" },
            { status: 404 }
        );
    }

    const result = await ds.testConnection();

    return NextResponse.json({
        datasource: {
            id: ds.id,
            type: ds.type,
            name: ds.name,
        },
        ...result,
    });
}
