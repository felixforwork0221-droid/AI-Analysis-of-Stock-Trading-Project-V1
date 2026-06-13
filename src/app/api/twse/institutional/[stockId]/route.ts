import { NextRequest, NextResponse } from "next/server";
import { getTwseInstitutionalTrades } from "@/services/twse/getTwseInstitutionalTrades";

type RouteContext = {
  params: Promise<{
    stockId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { stockId } = await context.params;
    const { searchParams } = new URL(request.url);

    const lookbackDays = Number(searchParams.get("lookbackDays") ?? 100);
    const limit = Number(searchParams.get("limit") ?? 60);

    const data = await getTwseInstitutionalTrades(stockId, {
      lookbackDays: Number.isFinite(lookbackDays) ? lookbackDays : 100,
      limit: Number.isFinite(limit) ? limit : 60,
    });

    const latest = data.at(-1);

    return NextResponse.json({
      source: "TWSE T86 三大法人買賣超日報",
      market: "上市",
      stockId,
      stockName: latest?.stockName ?? "",
      fetchedAt: new Date().toISOString(),
      count: data.length,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch TWSE institutional trades",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
