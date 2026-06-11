import type { TaiwanStockQuote } from "@/types/stock";

type TwseStockRaw = {
  Code?: string;
  Name?: string;
  TradeVolume?: string | number;
  TradeValue?: string | number;
  OpeningPrice?: string | number;
  HighestPrice?: string | number;
  LowestPrice?: string | number;
  ClosingPrice?: string | number;
  Change?: string | number;
  Transaction?: string | number;

  證券代號?: string;
  證券名稱?: string;
  成交股數?: string | number;
  成交金額?: string | number;
  開盤價?: string | number;
  最高價?: string | number;
  最低價?: string | number;
  收盤價?: string | number;
  漲跌價差?: string | number;
  成交筆數?: string | number;
};

function readField<T>(item: TwseStockRaw, englishKey: keyof TwseStockRaw, chineseKey: keyof TwseStockRaw): T | undefined {
  return (item[englishKey] ?? item[chineseKey]) as T | undefined;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  const text = String(value).replace(/,/g, "").trim();

  if (!text || text === "--") return null;

  const cleaned = text.replace(/[^\d.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return null;

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

export async function getTwseStocks(): Promise<TaiwanStockQuote[]> {
  const response = await fetch(
    "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`TWSE API request failed: ${response.status}`);
  }

  const rawData = (await response.json()) as TwseStockRaw[];

  return rawData
    .map((item) => {
      const code = readField<string>(item, "Code", "證券代號") ?? "";
      const name = readField<string>(item, "Name", "證券名稱") ?? "";

      const open = toNumber(readField(item, "OpeningPrice", "開盤價"));
      const high = toNumber(readField(item, "HighestPrice", "最高價"));
      const low = toNumber(readField(item, "LowestPrice", "最低價"));
      const close = toNumber(readField(item, "ClosingPrice", "收盤價"));
      const change = toNumber(readField(item, "Change", "漲跌價差"));

      const previousClose =
        close !== null && change !== null ? close - change : null;

      const changePercent =
        close !== null &&
        change !== null &&
        previousClose !== null &&
        previousClose !== 0
          ? Number(((change / previousClose) * 100).toFixed(2))
          : null;

      return {
        code,
        name,
        open,
        high,
        low,
        close,
        change,
        changePercent,
        tradeVolume: toNumber(readField(item, "TradeVolume", "成交股數")),
        tradeValue: toNumber(readField(item, "TradeValue", "成交金額")),
        transaction: toNumber(readField(item, "Transaction", "成交筆數")),
      };
    })
    .filter((stock) => stock.code && stock.name);
}
