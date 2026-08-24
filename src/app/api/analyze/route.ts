import { NextResponse } from "next/server";
import { handleAnalyzeRequest } from "@/lib/server-analysis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = await handleAnalyzeRequest(body);
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("Unhandled error in /api/analyze route:", error);
    return NextResponse.json(
      {
        error: "YarnMe server encountered an unexpected error. Please try again.",
      },
      { status: 500 },
    );
  }
}
