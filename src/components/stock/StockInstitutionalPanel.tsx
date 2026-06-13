"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type HistogramData,
  type IChartApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import type {
  TaiwanStockHistoryWithMa,
  TaiwanStockInstitutionalApiResponse,
  TaiwanStockInstitutionalTrade,
} from "@/types/stock";

type StockInstitutionalPanelProps = {
  stockId: string;
  stockName: string;
  history: TaiwanStockHistoryWithMa[];
};

type InstitutionKey =
  | "totalNetBuySell"
  | "foreignNetBuySell"
  | "investmentTrustNetBuySell"
  | "dealerNetBuySell";

const OPTIONS: {
  key: InstitutionKey;
  label: string;
}[] = [
  { key: "totalNetBuySell", label: "三大法人" },
  { key: "foreignNetBuySell", label: "外資" },
  { key: "investmentTrustNetBuySell", label: "投信" },
  { key: "dealerNetBuySell", label: "自營商" },
];

function formatSharesToLots(value: number | null) {
  if (value === null) return "-";

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(value / 1000);
}

function formatPrice(value: number | null) {
  if (value === null) return "-";

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function getValueColor(value: number | null) {
  if (value === null) return "text-slate-300";
  if (value > 0) return "text-red-400";
  if (value < 0) return "text-emerald-400";
  return "text-slate-300";
}

function getInstitutionValue(
  item: TaiwanStockInstitutionalTrade,
  key: InstitutionKey
) {
  return item[key];
}

function InstitutionalFlowChart({
  data,
  history,
  selectedKey,
}: {
  data: TaiwanStockInstitutionalTrade[];
  history: TaiwanStockHistoryWithMa[];
  selectedKey: InstitutionKey;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const closeByDate = useMemo(() => {
    return new Map(history.map((item) => [item.date, item.close]));
  }, [history]);

  const histogramData = useMemo<HistogramData<Time>[]>(() => {
    return data
      .map((item) => {
        const value = getInstitutionValue(item, selectedKey);

        if (value === null) return null;

        const lots = value / 1000;

        return {
          time: item.date as Time,
          value: lots,
          color: lots >= 0 ? "#ef4444" : "#10b981",
        };
      })
      .filter((item): item is HistogramData<Time> => item !== null);
  }, [data, selectedKey]);

  const lineData = useMemo<LineData<Time>[]>(() => {
    return data
      .map((item) => {
        const close = closeByDate.get(item.date);

        if (close === null || close === undefined) return null;

        return {
          time: item.date as Time,
          value: close,
        };
      })
      .filter((item): item is LineData<Time> => item !== null);
  }, [data, closeByDate]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || histogramData.length === 0) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 360,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#0f172a",
        },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: {
          color: "#1e293b",
        },
        horzLines: {
          color: "#1e293b",
        },
      },
      leftPriceScale: {
        visible: true,
        borderColor: "#334155",
      },
      rightPriceScale: {
        visible: true,
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "left",
      priceFormat: {
        type: "volume",
      },
      base: 0,
    });

    histogramSeries.setData(histogramData);

    const lineSeries = chart.addSeries(LineSeries, {
      priceScaleId: "right",
      color: "#fb923c",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    lineSeries.setData(lineData);

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [histogramData, lineData]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full overflow-hidden rounded-xl border border-slate-800"
    />
  );
}

export default function StockInstitutionalPanel({
  stockId,
  stockName,
  history,
}: StockInstitutionalPanelProps) {
  const [activeTab, setActiveTab] = useState<"flow" | "holding" | "distribution">(
    "flow"
  );
  const [selectedKey, setSelectedKey] =
    useState<InstitutionKey>("totalNetBuySell");
  const [response, setResponse] =
    useState<TaiwanStockInstitutionalApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadInstitutionalData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetch(
        `/api/twse/institutional/${stockId}?lookbackDays=100&limit=60`,
        {
          cache: "no-store",
        }
      );

      const json = await result.json();

      if (!result.ok) {
        throw new Error(json.message || "法人資料讀取失敗");
      }

      setResponse(json as TaiwanStockInstitutionalApiResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "法人資料讀取失敗"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInstitutionalData();
  }, [stockId]);

  const latest = response?.data.at(-1) ?? null;

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-cyan-400">
            Institutional Investors
          </p>

          <h2 className="text-xl font-bold">
            法人籌碼分析｜{stockId} {stockName}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            目前先接 TWSE 上市三大法人買賣超日報，顯示外資、投信、自營商與三大法人進出。
          </p>
        </div>

        <button
          onClick={loadInstitutionalData}
          disabled={isLoading}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "更新中..." : "更新法人資料"}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 rounded-xl border border-slate-800 bg-slate-950 p-1 text-sm">
        <button
          onClick={() => setActiveTab("flow")}
          className={`rounded-lg px-3 py-2 font-semibold transition ${
            activeTab === "flow"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-300 hover:text-cyan-300"
          }`}
        >
          法人進出
        </button>

        <button
          onClick={() => setActiveTab("holding")}
          className={`rounded-lg px-3 py-2 font-semibold transition ${
            activeTab === "holding"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-300 hover:text-cyan-300"
          }`}
        >
          持股比例
        </button>

        <button
          onClick={() => setActiveTab("distribution")}
          className={`rounded-lg px-3 py-2 font-semibold transition ${
            activeTab === "distribution"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-300 hover:text-cyan-300"
          }`}
        >
          籌碼分布
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {activeTab === "flow" && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            {OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSelectedKey(option.key)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  selectedKey === option.key
                    ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                    : "border-slate-700 text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {latest && (
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs text-slate-400">最新日期</p>
                <p className="mt-2 font-mono text-lg text-slate-100">
                  {latest.date}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs text-slate-400">三大法人</p>
                <p
                  className={`mt-2 font-mono text-lg ${getValueColor(
                    latest.totalNetBuySell
                  )}`}
                >
                  {formatSharesToLots(latest.totalNetBuySell)} 張
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs text-slate-400">外資</p>
                <p
                  className={`mt-2 font-mono text-lg ${getValueColor(
                    latest.foreignNetBuySell
                  )}`}
                >
                  {formatSharesToLots(latest.foreignNetBuySell)} 張
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs text-slate-400">投信 / 自營商</p>
                <p className="mt-2 font-mono text-sm text-slate-100">
                  投信：
                  <span className={getValueColor(latest.investmentTrustNetBuySell)}>
                    {formatSharesToLots(latest.investmentTrustNetBuySell)}
                  </span>{" "}
                  張
                </p>
                <p className="mt-1 font-mono text-sm text-slate-100">
                  自營商：
                  <span className={getValueColor(latest.dealerNetBuySell)}>
                    {formatSharesToLots(latest.dealerNetBuySell)}
                  </span>{" "}
                  張
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-8 text-center text-sm text-slate-400">
              法人資料讀取中...
            </div>
          )}

          {!isLoading && response && response.data.length > 0 && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">
                  紅柱：買超
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
                  綠柱：賣超
                </span>
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-orange-300">
                  橘線：股價
                </span>
                <span className="text-slate-500">
                  單位：張；股價依右側座標
                </span>
              </div>

              <InstitutionalFlowChart
                data={response.data}
                history={history}
                selectedKey={selectedKey}
              />

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                      <th className="px-3 py-3">日期</th>
                      <th className="px-3 py-3 text-right">三大法人</th>
                      <th className="px-3 py-3 text-right">外資</th>
                      <th className="px-3 py-3 text-right">投信</th>
                      <th className="px-3 py-3 text-right">自營商</th>
                      <th className="px-3 py-3 text-right">收盤價</th>
                    </tr>
                  </thead>

                  <tbody>
                    {response.data
                      .slice()
                      .reverse()
                      .map((item) => {
                        const close =
                          history.find((historyItem) => historyItem.date === item.date)
                            ?.close ?? null;

                        return (
                          <tr
                            key={item.date}
                            className="border-b border-slate-800/70 hover:bg-slate-800/60"
                          >
                            <td className="px-3 py-3 font-mono text-slate-200">
                              {item.date}
                            </td>
                            <td
                              className={`px-3 py-3 text-right font-mono ${getValueColor(
                                item.totalNetBuySell
                              )}`}
                            >
                              {formatSharesToLots(item.totalNetBuySell)}
                            </td>
                            <td
                              className={`px-3 py-3 text-right font-mono ${getValueColor(
                                item.foreignNetBuySell
                              )}`}
                            >
                              {formatSharesToLots(item.foreignNetBuySell)}
                            </td>
                            <td
                              className={`px-3 py-3 text-right font-mono ${getValueColor(
                                item.investmentTrustNetBuySell
                              )}`}
                            >
                              {formatSharesToLots(item.investmentTrustNetBuySell)}
                            </td>
                            <td
                              className={`px-3 py-3 text-right font-mono ${getValueColor(
                                item.dealerNetBuySell
                              )}`}
                            >
                              {formatSharesToLots(item.dealerNetBuySell)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-slate-300">
                              {formatPrice(close)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!isLoading && response && response.data.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-8 text-center text-sm text-slate-400">
              查無法人資料。請確認此股票是否為 TWSE 上市公司。
            </div>
          )}
        </>
      )}

      {activeTab === "holding" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-300">
          <h3 className="mb-2 text-lg font-bold text-slate-100">持股比例</h3>
          <p>
            下一階段可接「外資及陸資投資持股統計」，先顯示外資持股股數與外資持股比率。
          </p>
          <p className="mt-2 text-slate-500">
            注意：官方可取得資料以外資持股統計較完整；投信與自營商完整持股比例可能需要其他資料源或券商資料。
          </p>
        </div>
      )}

      {activeTab === "distribution" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-300">
          <h3 className="mb-2 text-lg font-bold text-slate-100">籌碼分布</h3>
          <p>
            下一階段可做圓環圖，顯示外資、投信、自營商、董監與其他投資人占比。
          </p>
          <p className="mt-2 text-slate-500">
            目前 V1 先以官方 TWSE 法人買賣超資料建立法人進出趨勢。
          </p>
        </div>
      )}
    </section>
  );
}
