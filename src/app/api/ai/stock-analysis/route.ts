import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import type { TaiwanStockHistoryWithMa } from "@/types/stock";

type StockAnalysisRequest = {
  stockId: string;
  stockName: string;
  latest: TaiwanStockHistoryWithMa;
  recent20High: number | null;
  recent20Low: number | null;
  history: TaiwanStockHistoryWithMa[];
};

function formatNumber(value: number | null) {
  if (value === null) return "N/A";
  return String(value);
}

function buildPrompt(input: StockAnalysisRequest) {
  const recentHistory = input.history.slice(-30).map((item) => ({
    date: item.date,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    change: item.change,
    ma5: item.ma5,
    ma10: item.ma10,
    ma20: item.ma20,
    tradeVolume: item.tradeVolume,
  }));

  return `
你是一位台股技術分析助理。請根據我提供的 TWSE 上市股票資料，產生一份「技術面分析」。不要捏造新聞、籌碼、法人、基本面或未提供的資料。

股票：
- 代號：${input.stockId}
- 名稱：${input.stockName}

最新資料：
- 日期：${input.latest.date}
- 收盤價：${formatNumber(input.latest.close)}
- 漲跌：${formatNumber(input.latest.change)}
- MA5：${formatNumber(input.latest.ma5)}
- MA10：${formatNumber(input.latest.ma10)}
- MA20：${formatNumber(input.latest.ma20)}
- 近 20 日高點：${formatNumber(input.recent20High)}
- 近 20 日低點：${formatNumber(input.recent20Low)}

近 30 筆交易資料：
${JSON.stringify(recentHistory, null, 2)}

請用繁體中文回答，格式固定如下：

## 技術面趨勢
說明目前價格與 MA5、MA10、MA20 的關係。

## 均線結構
判斷短中期均線是偏多、偏弱或盤整。

## 支撐與壓力
根據近 20 日高低點與近期收盤價，推估觀察區間。

## 成交量觀察
只能根據提供的成交量變化描述，不要誇大。

## 風險提醒
列出 2 到 3 個短線風險。

## 觀察結論
給出保守、明確、非保證獲利的觀察結論。

最後加上一句：本分析僅供系統測試與研究參考，不構成投資建議。
`;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: "Missing GOOGLE_GENERATIVE_AI_API_KEY",
          message: "請先在 .env.local 設定 GOOGLE_GENERATIVE_AI_API_KEY。",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as StockAnalysisRequest;

    if (!body.stockId || !body.latest || !Array.isArray(body.history)) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          message: "缺少 stockId、latest 或 history。",
        },
        { status: 400 }
      );
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const { text } = await generateText({
      model: google(modelName),
      prompt: buildPrompt(body),
    });

    return NextResponse.json({
      provider: "gemini",
      model: modelName,
      stockId: body.stockId,
      stockName: body.stockName,
      generatedAt: new Date().toISOString(),
      analysis: text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate Gemini stock analysis",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
