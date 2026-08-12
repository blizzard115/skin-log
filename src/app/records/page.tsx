import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ConcernLevel = "なし" | "少し" | "気になる" | "強い" | null;

type SkinRecord = {
  id: number;
  record_date: string;
  overall_condition: number;
  redness: ConcernLevel;
  dryness: ConcernLevel;
  acne: ConcernLevel;
  oiliness: ConcernLevel;
  skincare_used: string | null;
  memo: string | null;
  created_at: string;
};

export const metadata: Metadata = {
  title: "肌記録一覧 | SkinLog",
  description: "SkinLogでログイン中のユーザー本人の肌記録を確認する画面です。",
};

type ConcernRecordKey = keyof Pick<
  SkinRecord,
  "redness" | "dryness" | "acne" | "oiliness"
>;

const concernLabels: { label: string; key: ConcernRecordKey }[] = [
  { label: "赤み", key: "redness" },
  { label: "乾燥", key: "dryness" },
  { label: "ニキビ", key: "acne" },
  { label: "皮脂", key: "oiliness" },
];

function formatRecordDate(recordDate: string) {
  const [year, month, day] = recordDate.split("-");

  if (!year || !month || !day) {
    return recordDate;
  }

  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

function getTextOrFallback(value: string | null) {
  return value && value.trim() !== "" ? value : "未入力";
}

export default async function RecordsPage() {
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
    .select(
      "id, record_date, overall_condition, redness, dryness, acne, oiliness, skincare_used, memo, created_at",
    )
    .eq("user_id", userId)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<SkinRecord[]>();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="w-fit text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800"
            >
              ← トップページへ戻る
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
                  肌記録一覧
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  これまでに保存した肌状態とスキンケアを、新しい記録から確認できます。
                </p>
              </div>
            </div>

            <Link
              href="/records/new"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
            >
              今日の肌を記録する
            </Link>
          </div>
        </header>

        {error ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-red-800">
              記録を読み込めませんでした
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">
              時間をおいてもう一度お試しください。
            </p>
          </section>
        ) : null}

        {!error && records.length === 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-700">
              SL
            </p>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              まだ肌記録がありません
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              今日の肌状態を1件保存すると、ここに新しい順で表示されます。
            </p>
            <Link
              href="/records/new"
              className="mx-auto mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
            >
              今日の肌を記録する
            </Link>
          </section>
        ) : null}

        {!error && records.length > 0 ? (
          <section className="grid gap-4" aria-label="肌記録一覧">
            {records.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      記録日
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-950">
                      {formatRecordDate(record.record_date)}
                    </h2>
                  </div>

                  <div className="rounded-lg bg-sky-50 px-4 py-3 text-left sm:text-right">
                    <p className="text-xs font-semibold text-sky-700">
                      肌の総合状態
                    </p>
                    <p className="mt-1 text-2xl font-bold text-sky-900">
                      {record.overall_condition}
                      <span className="text-sm font-semibold text-sky-700">
                        /5
                      </span>
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {concernLabels.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <dt className="text-xs font-semibold text-slate-500">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">
                        {record[item.key] ?? "未選択"}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      使用したスキンケア
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {getTextOrFallback(record.skincare_used)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      メモ
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {getTextOrFallback(record.memo)}
                    </p>
                  </div>
                </div>

                <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
                  保存日時: {formatCreatedAt(record.created_at)}
                </p>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
