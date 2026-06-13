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

export type TaiwanStockHistoryPrice = {
  date: string;
  stockId: string;
  stockName: string;
  tradeVolume: number | null;
  tradeValue: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  change: number | null;
  transaction: number | null;
};

export type TaiwanStockHistoryWithMa = TaiwanStockHistoryPrice & {
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
};

export type TaiwanStockInstitutionalTrade = {
  date: string;
  stockId: string;
  stockName: string;
  foreignNetBuySell: number | null;
  investmentTrustNetBuySell: number | null;
  dealerNetBuySell: number | null;
  totalNetBuySell: number | null;
};

export type TaiwanStockInstitutionalApiResponse = {
  source: string;
  market: string;
  stockId: string;
  stockName: string;
  fetchedAt: string;
  count: number;
  data: TaiwanStockInstitutionalTrade[];
};
