import Link from "next/link";

export default function RecordNotFound() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-6 sm:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-700">
            SL
          </p>
          <h1 className="mt-5 text-xl font-semibold text-slate-950">
            肌記録が見つかりません
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            記録が存在しないか、表示できない記録です。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/records"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
            >
              肌記録一覧へ戻る
            </Link>
            <Link
              href="/records/new"
              className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-200 hover:text-sky-700 sm:w-fit"
            >
              新しい記録を作成する
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
