import { NextRequest, NextResponse } from "next/server";
import { attachMovingAverages } from "@/lib/indicators/movingAverage";
import { getTwseStockHistory } from "@/services/twse/getTwseStockHistory";

type RouteContext = {
  params: Promise<{
    stockId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { stockId } = await context.params;
    const { searchParams } = new URL(request.url);

    const months = Number(searchParams.get("months") ?? 4);
    const limit = Number(searchParams.get("limit") ?? 60);

    const history = await getTwseStockHistory(stockId, {
      months: Number.isFinite(months) ? months : 4,
      limit: Number.isFinite(limit) ? limit : 60,
    });

    const data = attachMovingAverages(history);
    const latest = data.at(-1) ?? null;

    return NextResponse.json({
      source: "TWSE STOCK_DAY",
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
        error: "Failed to fetch TWSE historical stock data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
