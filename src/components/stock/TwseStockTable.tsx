"use client";

import { useEffect, useState } from "react";
import type { TaiwanStockApiResponse, TaiwanStockQuote } from "@/types/stock";

const DEFAULT_SYMBOLS = "2330,2317,2454,2382,3231,3661,2308,3037";

function formatNumber(value: number | null, digits = 2) {
  if (value === null) return "-";

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
  }).format(value);
}

function formatLargeNumber(value: number | null) {
  if (value === null) return "-";

  return new Intl.NumberFormat("zh-TW", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function getChangeClass(stock: TaiwanStockQuote) {
  if (stock.change === null) return "text-slate-300";
  if (stock.change > 0) return "text-red-400";
  if (stock.change < 0) return "text-emerald-400";
  return "text-slate-300";
}

export default function TwseStockTable() {
  const [data, setData] = useState<TaiwanStockApiResponse | null>(null);
  const [query, setQuery] = useState("");
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStocks(url: string) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API 回傳錯誤：HTTP ${response.status}`);
      }

      const result = (await response.json()) as TaiwanStockApiResponse;
      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "資料讀取失敗"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStocks(`/api/twse/stocks?symbols=${DEFAULT_SYMBOLS}`);
  }, []);

  function handleSearch() {
    if (query.trim()) {
      void loadStocks(`/api/twse/stocks?q=${encodeURIComponent(query.trim())}`);
      return;
    }

    void loadStocks(`/api/twse/stocks?symbols=${encodeURIComponent(symbols)}`);
  }

  function handleLoadWatchlist() {
    void loadStocks(`/api/twse/stocks?symbols=${encodeURIComponent(symbols)}`);
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-cyan-400">
            TWSE Market Data
          </p>

          <h2 className="text-2xl font-bold text-slate-100">
            台股上市盤後資訊
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            目前顯示 TWSE 上市股票最新盤後資料，之後可再擴充上櫃、歷史 K 線與 AI 分析。
          </p>
        </div>

        <button
          onClick={handleLoadWatchlist}
          disabled={isLoading}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
        >
          更新自選股
        </button>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <input
          value={symbols}
          onChange={(event) => setSymbols(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
          placeholder="自選股代號，例如 2330,2317,2454"
        />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
          placeholder="搜尋代號或名稱，例如 2330、台積電"
        />

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-60"
        >
          搜尋
        </button>
      </div>

      {data && (
        <div className="mb-4 text-xs text-slate-400">
          來源：{data.source}｜市場：{data.market}｜筆數：{data.count}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-3 py-3">代號</th>
              <th className="px-3 py-3">名稱</th>
              <th className="px-3 py-3 text-right">收盤</th>
              <th className="px-3 py-3 text-right">漲跌</th>
              <th className="px-3 py-3 text-right">漲跌幅</th>
              <th className="px-3 py-3 text-right">開盤</th>
              <th className="px-3 py-3 text-right">最高</th>
              <th className="px-3 py-3 text-right">最低</th>
              <th className="px-3 py-3 text-right">成交量</th>
              <th className="px-3 py-3 text-right">成交值</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-400">
                  資料讀取中...
                </td>
              </tr>
            )}

            {!isLoading &&
              data?.data.map((stock) => {
                const changeClass = getChangeClass(stock);

                return (
                  <tr
                    key={stock.code}
                    className="border-b border-slate-800/70 hover:bg-slate-800/60"
                  >
                    <td className="px-3 py-3 font-mono text-slate-200">
                      {stock.code}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-100">
                      {stock.name}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-100">
                      {formatNumber(stock.close)}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${changeClass}`}>
                      {formatNumber(stock.change)}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${changeClass}`}>
                      {stock.changePercent === null
                        ? "-"
                        : `${formatNumber(stock.changePercent)}%`}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatNumber(stock.open)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatNumber(stock.high)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatNumber(stock.low)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatLargeNumber(stock.tradeVolume)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatLargeNumber(stock.tradeValue)}
                    </td>
                  </tr>
                );
              })}

            {!isLoading && data && data.data.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-400">
                  查無資料。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
