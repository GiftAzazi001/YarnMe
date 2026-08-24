import { NextResponse } from "next/server";
import { handleAskRequest } from "@/lib/server-analysis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = await handleAskRequest(body);
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("Unhandled error in /api/ask route:", error);
    return NextResponse.json(
      {
        error: "Failed to answer question.",
      },
      { status: 500 },
    );
  }
}
