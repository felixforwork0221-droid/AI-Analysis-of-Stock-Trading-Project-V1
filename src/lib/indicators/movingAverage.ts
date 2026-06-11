import type {
  TaiwanStockHistoryPrice,
  TaiwanStockHistoryWithMa,
} from "@/types/stock";

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function calculateMa(
  data: TaiwanStockHistoryPrice[],
  currentIndex: number,
  period: number
): number | null {
  if (currentIndex + 1 < period) return null;

  const window = data.slice(currentIndex + 1 - period, currentIndex + 1);
  const closes = window
    .map((item) => item.close)
    .filter((value): value is number => value !== null);

  if (closes.length !== period) return null;

  const sum = closes.reduce((total, value) => total + value, 0);

  return round(sum / period);
}

export function attachMovingAverages(
  data: TaiwanStockHistoryPrice[]
): TaiwanStockHistoryWithMa[] {
  return data.map((item, index) => ({
    ...item,
    ma5: calculateMa(data, index, 5),
    ma10: calculateMa(data, index, 10),
    ma20: calculateMa(data, index, 20),
  }));
}
