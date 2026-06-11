export type TaiwanStockQuote = {
  code: string;
  name: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  change: number | null;
  changePercent: number | null;
  tradeVolume: number | null;
  tradeValue: number | null;
  transaction: number | null;
};

export type TaiwanStockApiResponse = {
  source: string;
  market: string;
  fetchedAt: string;
  count: number;
  data: TaiwanStockQuote[];
};
