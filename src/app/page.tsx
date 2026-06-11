const analysisModules = [
  {
    title: "股票基本資訊",
    description: "股票代號、公司名稱、即時價格、漲跌幅與交易市場",
  },
  {
    title: "技術面模組",
    description: "K 線、成交量、均線、MACD、RSI 與支撐壓力分析",
  },
  {
    title: "籌碼面模組",
    description: "外資、投信、自營商、融資融券與法人持股變化",
  },
  {
    title: "基本面模組",
    description: "營收、EPS、毛利率、營業利益率與財務報表分析",
  },
  {
    title: "催化劑模組",
    description: "重大新聞、訂單、法說會、產業趨勢與供應鏈事件",
  },
  {
    title: "交易策略模組",
    description: "進場價格、分批加碼、停損價格、目標價與部位配置",
  },
  {
    title: "AI 分析報告",
    description: "整合 GPT 與 Gemini 的分析結果與差異比較",
  },
  {
    title: "系統輸出",
    description: "投資評級、風險分數、最終結論與分析報告輸出",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium text-cyan-400">
            AI Stock Analysis Dashboard
          </p>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            人工智慧股票交易分析系統
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            整合台股、美股、技術面、籌碼面、基本面與雙 AI 分析結果。
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {analysisModules.map((module) => (
            <article
              key={module.title}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:border-cyan-700"
            >
              <h2 className="mb-3 text-lg font-semibold text-cyan-300">
                {module.title}
              </h2>

              <p className="text-sm leading-6 text-slate-400">
                {module.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}