import type { TaiwanStockInstitutionalTrade } from "@/types/stock";

type TwseT86Response = {
  stat?: string;
  date?: string;
  title?: string;
  fields?: string[];
  data?: string[][];
};

type GetTwseInstitutionalTradesOptions = {
  lookbackDays?: number;
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

function normalizeField(value: string) {
  return value.replace(/\s/g, "");
}

function findFieldIndex(fields: string[], keywords: string[]) {
  return fields.findIndex((field) => {
    const normalized = normalizeField(field);
    return keywords.every((keyword) => normalized.includes(keyword));
  });
}

function findExactOrKeywordIndex(fields: string[], exact: string, keywords: string[]) {
  const exactIndex = fields.findIndex(
    (field) => normalizeField(field) === exact
  );

  if (exactIndex >= 0) return exactIndex;

  return findFieldIndex(fields, keywords);
}

function formatTwseDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecentCalendarDates(days: number) {
  const now = new Date();

  return Array.from({ length: days }, (_, index) => {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - index);
  });
}

async function fetchDailyInstitutionalTrade(
  stockId: string,
  date: Date
): Promise<TaiwanStockInstitutionalTrade | null> {
  const queryDate = formatTwseDate(date);

  const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${queryDate}&selectType=ALLBUT0999&response=json`;

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
    return null;
  }

  const result = (await response.json()) as TwseT86Response;

  if (!result.fields || !result.data || result.data.length === 0) {
    return null;
  }

  const fields = result.fields;

  const codeIndex = findFieldIndex(fields, ["證券代號"]);
  const nameIndex = findFieldIndex(fields, ["證券名稱"]);
  const foreignNetIndex = findFieldIndex(fields, [
    "外陸資買賣超股數",
    "不含外資自營商",
  ]);
  const trustNetIndex = findFieldIndex(fields, ["投信買賣超股數"]);
  const dealerNetIndex = findExactOrKeywordIndex(fields, "自營商買賣超股數", [
    "自營商買賣超股數",
  ]);
  const totalNetIndex = findFieldIndex(fields, ["三大法人買賣超股數"]);

  if (
    codeIndex < 0 ||
    nameIndex < 0 ||
    foreignNetIndex < 0 ||
    trustNetIndex < 0 ||
    dealerNetIndex < 0 ||
    totalNetIndex < 0
  ) {
    return null;
  }

  const row = result.data.find(
    (item) => String(item[codeIndex]).trim() === stockId
  );

  if (!row) return null;

  return {
    date: formatIsoDate(date),
    stockId: String(row[codeIndex]).trim(),
    stockName: String(row[nameIndex]).trim(),
    foreignNetBuySell: toNumber(row[foreignNetIndex]),
    investmentTrustNetBuySell: toNumber(row[trustNetIndex]),
    dealerNetBuySell: toNumber(row[dealerNetIndex]),
    totalNetBuySell: toNumber(row[totalNetIndex]),
  };
}

async function mapInChunks<T, R>(
  items: T[],
  chunkSize: number,
  mapper: (item: T) => Promise<R>
) {
  const output: R[] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    const chunk = items.slice(index, index + chunkSize);
    const results = await Promise.allSettled(chunk.map(mapper));

    for (const result of results) {
      if (result.status === "fulfilled") {
        output.push(result.value);
      }
    }
  }

  return output;
}

export async function getTwseInstitutionalTrades(
  stockId: string,
  options: GetTwseInstitutionalTradesOptions = {}
): Promise<TaiwanStockInstitutionalTrade[]> {
  const lookbackDays = options.lookbackDays ?? 100;
  const limit = options.limit ?? 60;

  const dates = getRecentCalendarDates(lookbackDays);

  const results = await mapInChunks(dates, 8, (date) =>
    fetchDailyInstitutionalTrade(stockId, date)
  );

  return results
    .filter((item): item is TaiwanStockInstitutionalTrade => item !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit);
}
