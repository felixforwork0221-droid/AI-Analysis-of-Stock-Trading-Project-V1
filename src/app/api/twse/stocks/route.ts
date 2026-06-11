import { NextRequest, NextResponse } from "next/server";
import { getTwseStocks } from "@/services/twse/getTwseStocks";

const DEFAULT_SYMBOLS = [
  "2330",
  "2317",
  "2454",
  "2382",
  "3231",
  "3661",
  "2308",
  "3037",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const symbolsParam = searchParams.get("symbols");
    const query = searchParams.get("q")?.trim();

    const symbols = symbolsParam
      ? symbolsParam
          .split(",")
          .map((symbol) => symbol.trim())
          .filter(Boolean)
      : DEFAULT_SYMBOLS;

    const stocks = await getTwseStocks();

    let filteredStocks = stocks;

    if (query) {
      filteredStocks = stocks.filter(
        (stock) => stock.code.includes(query) || stock.name.includes(query)
      );
    } else if (symbols.length > 0) {
      filteredStocks = stocks.filter((stock) => symbols.includes(stock.code));
    }

    return NextResponse.json(
      {
        source: "TWSE OpenAPI /exchangeReport/STOCK_DAY_ALL",
        market: "上市",
        fetchedAt: new Date().toISOString(),
        count: filteredStocks.length,
        data: filteredStocks,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch TWSE stock data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
