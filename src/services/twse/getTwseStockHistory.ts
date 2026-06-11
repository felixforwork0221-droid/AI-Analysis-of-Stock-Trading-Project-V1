import type { TaiwanStockHistoryPrice } from "@/types/stock";

type TwseStockDayResponse = {
  stat?: string;
  date?: string;
  title?: string;
  fields?: string[];
  data?: string[][];
  notes?: string[];
};

type GetTwseStockHistoryOptions = {
  months?: number;
  limit?: number;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  const text = String(value).replace(/,/g, "").trim();

  if (!text || text === "--") return null;

  const cleaned = text.replace(/[^\d.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return null;

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function formatDateForTwse(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}${month}01`;
}

function getRecentMonthDates(months: number) {
  const now = new Date();

  return Array.from({ length: months }, (_, index) => {
    return new Date(now.getFullYear(), now.getMonth() - index, 1);
  });
}

function parseRocDate(value: string) {
  const [rocYearText, monthText, dayText] = value.split("/");

  const year = Number(rocYearText) + 1911;
  const month = monthText.padStart(2, "0");
  const day = dayText.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseStockName(title: string | undefined, stockId: string) {
  if (!title) return "";

  const parts = title.split(/\s+/);
  const stockIdIndex = parts.findIndex((part) => part === stockId);

  if (stockIdIndex >= 0 && parts[stockIdIndex + 1]) {
    return parts[stockIdIndex + 1].replace("各日成交資訊", "");
  }

  return "";
}

async function fetchMonthlyStockHistory(
  stockId: string,
  date: Date
): Promise<TaiwanStockHistoryPrice[]> {
  const queryDate = formatDateForTwse(date);

  const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${queryDate}&stockNo=${stockId}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error(`TWSE historical API request failed: ${response.status}`);
  }

  const result = (await response.json()) as TwseStockDayResponse;

  if (!result.data || result.data.length === 0) {
    return [];
  }

  const stockName = parseStockName(result.title, stockId);

  return result.data.map((row) => ({
    date: parseRocDate(row[0]),
    stockId,
    stockName,
    tradeVolume: toNumber(row[1]),
    tradeValue: toNumber(row[2]),
    open: toNumber(row[3]),
    high: toNumber(row[4]),
    low: toNumber(row[5]),
    close: toNumber(row[6]),
    change: toNumber(row[7]),
    transaction: toNumber(row[8]),
  }));
}

export async function getTwseStockHistory(
  stockId: string,
  options: GetTwseStockHistoryOptions = {}
): Promise<TaiwanStockHistoryPrice[]> {
  const months = options.months ?? 4;
  const limit = options.limit ?? 60;

  const monthDates = getRecentMonthDates(months);

  const monthlyData = await Promise.all(
    monthDates.map((date) => fetchMonthlyStockHistory(stockId, date))
  );

  const mergedData = monthlyData.flat();

  const uniqueByDate = new Map<string, TaiwanStockHistoryPrice>();

  for (const item of mergedData) {
    uniqueByDate.set(item.date, item);
  }

  return Array.from(uniqueByDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}
