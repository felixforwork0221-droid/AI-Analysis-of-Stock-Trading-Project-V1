import StockAiAnalysis from "@/components/stock/StockAiAnalysis";
import StockInstitutionalPanel from "@/components/stock/StockInstitutionalPanel";
import StockCandlestickChart from "@/components/stock/StockCandlestickChart";
import Link from "next/link";
import { attachMovingAverages } from "@/lib/indicators/movingAverage";
import { getTwseStockHistory } from "@/services/twse/getTwseStockHistory";

type StockPageProps = {
  params: Promise<{
    stockId: string;
  }>;
};

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

function getChangeClass(value: number | null) {
  if (value === null) return "text-slate-300";
  if (value > 0) return "text-red-400";
  if (value < 0) return "text-emerald-400";
  return "text-slate-300";
}

function getTrendLabel(
  close: number | null,
  ma5: number | null,
  ma20: number | null
) {
  if (close === null || ma5 === null || ma20 === null) {
    return "資料不足";
  }

  if (close > ma5 && ma5 > ma20) {
    return "短線偏多";
  }

  if (close < ma5 && ma5 < ma20) {
    return "短線偏弱";
  }

  return "盤整觀察";
}

export default async function StockDetailPage({ params }: StockPageProps) {
  const { stockId } = await params;

  let history;

  try {
    history = await getTwseStockHistory(stockId, {
      months: 4,
      limit: 60,
    });
  } catch (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
            ← 回首頁
          </Link>

          <div className="mt-8 rounded-2xl border border-red-800 bg-red-950/40 p-6 text-red-200">
            <h1 className="text-2xl font-bold">資料讀取失敗</h1>
            <p className="mt-3 text-sm">
              {error instanceof Error ? error.message : "未知錯誤"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const data = attachMovingAverages(history);
  const latest = data.at(-1);

  if (!latest) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
            ← 回首頁
          </Link>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h1 className="text-2xl font-bold">查無上市股票資料</h1>
            <p className="mt-3 text-sm text-slate-400">
              請確認股票代號是否為 TWSE 上市公司，例如 2330、2317、2454。
            </p>
          </div>
        </div>
      </main>
    );
  }

  const recent20 = data.slice(-20);
  const recentHighValues = recent20
    .map((item) => item.high)
    .filter((value): value is number => value !== null);
  const recentLowValues = recent20
    .map((item) => item.low)
    .filter((value): value is number => value !== null);

  const recent20High =
    recentHighValues.length > 0 ? Math.max(...recentHighValues) : null;
  const recent20Low =
    recentLowValues.length > 0 ? Math.min(...recentLowValues) : null;

  const trendLabel = getTrendLabel(latest.close, latest.ma5, latest.ma20);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← 回首頁
        </Link>

        <header className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <p className="mb-2 text-sm font-medium text-cyan-400">
            TWSE Listed Stock Detail
          </p>

          <h1 className="text-3xl font-bold">
            {latest.stockId} {latest.stockName || "上市個股"}
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            最近 60 筆交易日資料，資料來源為 TWSE 個股日成交資訊。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">最新收盤</p>
            <p className="mt-2 text-2xl font-bold">
              {formatNumber(latest.close)}
            </p>
            <p className={`mt-1 text-sm ${getChangeClass(latest.change)}`}>
              漲跌 {formatNumber(latest.change)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">均線結構</p>
            <p className="mt-2 text-sm text-slate-300">
              MA5：{formatNumber(latest.ma5)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              MA10：{formatNumber(latest.ma10)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              MA20：{formatNumber(latest.ma20)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">近 20 日區間</p>
            <p className="mt-2 text-sm text-slate-300">
              高點：{formatNumber(recent20High)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              低點：{formatNumber(recent20Low)}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">初步技術判斷</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">
              {trendLabel}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              依收盤價、MA5、MA20 的相對位置初步判斷。
            </p>
          </div>
        </section>
                <StockCandlestickChart
          data={data}
          title={`${latest.stockId} ${latest.stockName || "上市個股"} K 線圖`}
               />

        <StockInstitutionalPanel
          stockId={latest.stockId}
          stockName={latest.stockName || "上市個股"}
          history={data}
        />

        <StockAiAnalysis
          stockId={latest.stockId}
          stockName={latest.stockName || "上市個股"}
          latest={latest}
          recent20High={recent20High}
          recent20Low={recent20Low}
          history={data}
        />

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-bold">近 60 筆交易日資料</h2>
            <p className="mt-2 text-sm text-slate-400">
              包含開高低收、成交量、成交值與 MA5 / MA10 / MA20。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-3 py-3">日期</th>
                  <th className="px-3 py-3 text-right">收盤</th>
                  <th className="px-3 py-3 text-right">漲跌</th>
                  <th className="px-3 py-3 text-right">開盤</th>
                  <th className="px-3 py-3 text-right">最高</th>
                  <th className="px-3 py-3 text-right">最低</th>
                  <th className="px-3 py-3 text-right">MA5</th>
                  <th className="px-3 py-3 text-right">MA10</th>
                  <th className="px-3 py-3 text-right">MA20</th>
                  <th className="px-3 py-3 text-right">成交量</th>
                  <th className="px-3 py-3 text-right">成交值</th>
                </tr>
              </thead>

              <tbody>
                {data
                  .slice()
                  .reverse()
                  .map((item) => (
                    <tr
                      key={item.date}
                      className="border-b border-slate-800/70 hover:bg-slate-800/60"
                    >
                      <td className="px-3 py-3 font-mono text-slate-200">
                        {item.date}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-100">
                        {formatNumber(item.close)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-mono ${getChangeClass(
                          item.change
                        )}`}
                      >
                        {formatNumber(item.change)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatNumber(item.open)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatNumber(item.high)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatNumber(item.low)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatNumber(item.ma5)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatNumber(item.ma10)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatNumber(item.ma20)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatLargeNumber(item.tradeVolume)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300">
                        {formatLargeNumber(item.tradeValue)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
