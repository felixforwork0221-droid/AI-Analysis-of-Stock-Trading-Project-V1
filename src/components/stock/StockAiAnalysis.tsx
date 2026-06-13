"use client";

import { useState } from "react";
import type { TaiwanStockHistoryWithMa } from "@/types/stock";

type StockAiAnalysisProps = {
  stockId: string;
  stockName: string;
  latest: TaiwanStockHistoryWithMa;
  recent20High: number | null;
  recent20Low: number | null;
  history: TaiwanStockHistoryWithMa[];
};

type AiAnalysisResponse = {
  provider: string;
  model: string;
  stockId: string;
  stockName: string;
  generatedAt: string;
  analysis: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date(value));
}

export default function StockAiAnalysis({
  stockId,
  stockName,
  latest,
  recent20High,
  recent20Low,
  history,
}: StockAiAnalysisProps) {
  const [analysis, setAnalysis] = useState<AiAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGenerateAnalysis() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/stock-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockId,
          stockName,
          latest,
          recent20High,
          recent20Low,
          history,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "AI 分析產生失敗");
      }

      setAnalysis(result as AiAnalysisResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "AI 分析產生失敗"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-cyan-400">
            Gemini AI Technical Analysis
          </p>

          <h2 className="text-xl font-bold">AI 技術面分析</h2>

          <p className="mt-2 text-sm text-slate-400">
            根據目前頁面的 K 線、MA5、MA10、MA20、近 20 日高低點與成交量資料產生分析。
          </p>
        </div>

        <button
          onClick={handleGenerateAnalysis}
          disabled={isLoading}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "分析產生中..." : "產生 Gemini 分析"}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {!analysis && !errorMessage && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-5 text-sm text-slate-400">
          尚未產生 AI 分析。按下「產生 Gemini 分析」後，系統會呼叫 Gemini API。
        </div>
      )}

      {analysis && (
        <article className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <div className="mb-4 text-xs text-slate-500">
            Provider：{analysis.provider}｜Model：{analysis.model}｜產生時間：
            {formatDateTime(analysis.generatedAt)}
          </div>

          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {analysis.analysis}
          </div>
        </article>
      )}
    </section>
  );
}
