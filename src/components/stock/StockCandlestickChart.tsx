"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  type CandlestickData,
  type IChartApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import type { TaiwanStockHistoryWithMa } from "@/types/stock";

type StockCandlestickChartProps = {
  data: TaiwanStockHistoryWithMa[];
  title: string;
};

function hasOhlcData(item: TaiwanStockHistoryWithMa) {
  return (
    item.open !== null &&
    item.high !== null &&
    item.low !== null &&
    item.close !== null
  );
}

export default function StockCandlestickChart({
  data,
  title,
}: StockCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const candleData = useMemo<CandlestickData<Time>[]>(() => {
    return data.filter(hasOhlcData).map((item) => ({
      time: item.date as Time,
      open: item.open as number,
      high: item.high as number,
      low: item.low as number,
      close: item.close as number,
    }));
  }, [data]);

  const ma5Data = useMemo<LineData<Time>[]>(() => {
    return data
      .filter((item) => item.ma5 !== null)
      .map((item) => ({
        time: item.date as Time,
        value: item.ma5 as number,
      }));
  }, [data]);

  const ma10Data = useMemo<LineData<Time>[]>(() => {
    return data
      .filter((item) => item.ma10 !== null)
      .map((item) => ({
        time: item.date as Time,
        value: item.ma10 as number,
      }));
  }, [data]);

  const ma20Data = useMemo<LineData<Time>[]>(() => {
    return data
      .filter((item) => item.ma20 !== null)
      .map((item) => ({
        time: item.date as Time,
        value: item.ma20 as number,
      }));
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || candleData.length === 0) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 430,
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
      rightPriceScale: {
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#10b981",
      borderUpColor: "#ef4444",
      borderDownColor: "#10b981",
      wickUpColor: "#ef4444",
      wickDownColor: "#10b981",
    });

    candleSeries.setData(candleData);

    const ma5Series = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ma5Series.setData(ma5Data);

    const ma10Series = chart.addSeries(LineSeries, {
      color: "#facc15",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ma10Series.setData(ma10Data);

    const ma20Series = chart.addSeries(LineSeries, {
      color: "#a78bfa",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ma20Series.setData(ma20Data);

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
  }, [candleData, ma5Data, ma10Data, ma20Data]);

  if (candleData.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-3 text-sm text-slate-400">
          目前沒有足夠的開高低收資料可以繪製 K 線圖。
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-cyan-400">
            Candlestick Chart
          </p>

          <h2 className="text-xl font-bold">{title}</h2>

          <p className="mt-2 text-sm text-slate-400">
            紅 K 代表收漲，綠 K 代表收跌，並疊加 MA5 / MA10 / MA20。
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">
            紅 K：上漲
          </span>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
            綠 K：下跌
          </span>
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-300">
            MA5
          </span>
          <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-yellow-300">
            MA10
          </span>
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-violet-300">
            MA20
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[430px] w-full overflow-hidden rounded-xl border border-slate-800"
      />
    </section>
  );
}
