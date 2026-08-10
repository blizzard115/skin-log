import Link from "next/link";

const skinItems = ["赤み", "乾燥", "ニキビ", "皮脂"];

const flowSteps = [
  "記録する",
  "振り返る",
  "自分に合うケアを知る",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-700">
              SL
            </div>
            <span className="text-lg font-semibold text-slate-950">
              SkinLog
            </span>
          </div>
          <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
            Daily care log
          </span>
        </header>

        <section className="flex flex-1 flex-col gap-10 py-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="flex flex-col gap-8">
            <div className="space-y-5">
              <p className="inline-flex rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
                男性向けスキンケア記録アプリ
              </p>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                  SkinLog
                </h1>
                <p className="text-2xl font-semibold leading-relaxed text-slate-900 sm:text-3xl">
                  肌の変化を、なんとなくで終わらせない。
                </p>
              </div>

              <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                毎日の肌状態と使用したスキンケアを記録し、自分に合うケアを振り返るためのアプリです。
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <Link
                href="/records/new"
                className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
              >
                今日の肌を記録する
              </Link>

              <ul className="flex flex-wrap gap-2" aria-label="記録項目の例">
                {skinItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <p className="text-sm font-medium text-slate-500">今日の記録</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                肌コンディション
              </h2>
            </div>

            <dl className="grid grid-cols-2">
              {skinItems.map((item, index) => (
                <div
                  key={item}
                  className={`border-slate-100 p-5 ${
                    index % 2 === 0 ? "border-r" : ""
                  } ${index < 2 ? "border-b" : ""}`}
                >
                  <dt className="text-sm font-medium text-slate-500">{item}</dt>
                  <dd className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
                    記録できます
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="pb-8">
          <h2 className="text-sm font-semibold text-slate-500">
            SkinLogでできる流れ
          </h2>
          <ol className="mt-4 flex list-none flex-wrap items-center gap-x-3 gap-y-2">
            {flowSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span className="text-base font-semibold text-slate-900">
                  {step}
                </span>
                {index < flowSteps.length - 1 ? (
                  <span
                    className="text-slate-300"
                    aria-hidden="true"
                  >
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
