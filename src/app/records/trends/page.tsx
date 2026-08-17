import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import {
  getRecentTrendRecordsForDisplay,
  skinRecordTrendLimit,
  type SkinRecordTrendSource,
} from "@/lib/skin-record-trends";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "肌状態の推移 | SkinLog",
  description: "SkinLogで直近7件の肌状態の推移を確認する画面です。",
};

function formatRecordDate(recordDate: string) {
  const [year, month, day] = recordDate.split("-");

  if (!year || !month || !day) {
    return recordDate;
  }

  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export default async function SkinRecordTrendsPage() {
  const supabase = await createSupabaseServerClient();
  let userId: string | undefined;

  try {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims.sub;
  } catch {
    userId = undefined;
  }

  if (!userId) {
    redirect("/auth/login");
  }

  const { data: records, error } = await supabase
    .from("skin_records")
    .select("id, record_date, overall_condition, created_at")
    .eq("user_id", userId)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(skinRecordTrendLimit)
    .returns<SkinRecordTrendSource[]>();

  const trendRecords = error
    ? []
    : getRecentTrendRecordsForDisplay(records ?? []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/records"
              className="w-fit text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800"
            >
              ← 肌記録一覧へ戻る
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-200 hover:text-sky-700"
              >
                ログアウト
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="inline-flex rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
                SkinLog
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                  肌状態の推移
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  直近7件の総合状態を、古い記録から新しい記録の順に並べて振り返ります。
                </p>
              </div>
            </div>

            <Link
              href="/records/new"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
            >
              新しい記録を作成する
            </Link>
          </div>
        </header>

        {error ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-red-800">
              推移を読み込めませんでした
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">
              時間をおいてもう一度お試しください。
            </p>
          </section>
        ) : null}

        {!error && trendRecords.length === 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-700">
              SL
            </p>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              まだ推移を表示できる記録がありません
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              肌記録を保存すると、ここで総合状態の変化を振り返れます。
            </p>
            <Link
              href="/records/new"
              className="mx-auto mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
            >
              今日の肌を記録する
            </Link>
          </section>
        ) : null}

        {!error && trendRecords.length > 0 ? (
          <section
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            aria-labelledby="trend-chart-heading"
          >
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2
                  id="trend-chart-heading"
                  className="text-xl font-semibold text-slate-950"
                >
                  総合状態の記録
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  表示中の記録は{trendRecords.length}件です。数値は5段階で、入力された値をそのまま表示しています。
                </p>
              </div>
              <p className="w-fit rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                直近{skinRecordTrendLimit}件まで
              </p>
            </div>

            {trendRecords.length === 1 ? (
              <p className="mt-5 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-800">
                推移を確認するには、複数の記録が必要です。まずはこの記録を基準に、次回以降の記録と比べてみましょう。
              </p>
            ) : null}

            <ol className="mt-6 space-y-4" aria-label="肌状態の推移">
              {trendRecords.map((record, index) => (
                <li key={record.id}>
                  <Link
                    href={`/records/${record.id}`}
                    className="block rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-sky-200 hover:bg-sky-50 sm:p-5"
                    aria-label={`${formatRecordDate(record.record_date)}の詳細を見る。総合状態は${record.overallConditionLabel}、5段階中${record.overall_condition}です。`}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-sky-700 ring-1 ring-slate-200">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {formatRecordDate(record.record_date)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              作成日時: {formatCreatedAt(record.created_at)}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-sm font-semibold text-sky-900">
                              {record.overallConditionLabel}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-950">
                              {record.overall_condition}
                              <span className="text-xs font-semibold text-slate-500">
                                /5
                              </span>
                            </p>
                          </div>
                        </div>

                        <div
                          className="mt-4 h-3 rounded-full bg-slate-200"
                          aria-hidden="true"
                        >
                          <div
                            className="h-3 rounded-full bg-sky-500"
                            style={{
                              width: `${record.overallConditionPercent}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-sky-700">
                          詳細を見る →
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
