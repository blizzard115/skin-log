import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

type RecordDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "肌記録詳細 | SkinLog",
  description: "SkinLogで保存した肌記録の内容を確認する画面です。",
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

function parseRecordId(id: string) {
  if (!/^\d+$/.test(id)) {
    return undefined;
  }

  const recordId = Number(id);
  return Number.isSafeInteger(recordId) && recordId > 0 ? recordId : undefined;
}

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

export default async function RecordDetailPage({
  params,
}: RecordDetailPageProps) {
  const { id } = await params;
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

  const recordId = parseRecordId(id);

  if (!recordId) {
    notFound();
  }

  const { data: record, error } = await supabase
    .from("skin_records")
    .select(
      "id, record_date, overall_condition, redness, dryness, acne, oiliness, skincare_used, memo, created_at",
    )
    .eq("id", recordId)
    .eq("user_id", userId)
    .maybeSingle()
    .returns<SkinRecord | null>();

  if (!record && !error) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 lg:py-10">
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
                  肌記録詳細
                </h1>
                <p className="text-base leading-7 text-slate-600">
                  選択した日の肌状態と使用したスキンケアを確認できます。
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
              記録を読み込めませんでした
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">
              時間をおいてもう一度お試しください。
            </p>
          </section>
        ) : null}

        {!error && record ? (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">記録日</p>
                <h2 className="mt-1 text-3xl font-bold text-slate-950">
                  {formatRecordDate(record.record_date)}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  保存日時: {formatCreatedAt(record.created_at)}
                </p>
              </div>

              <div className="rounded-lg bg-sky-50 px-4 py-3 text-left sm:text-right">
                <p className="text-xs font-semibold text-sky-700">
                  肌の総合状態
                </p>
                <p className="mt-1 text-3xl font-bold text-sky-900">
                  {record.overall_condition}
                  <span className="text-sm font-semibold text-sky-700">
                    /5
                  </span>
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

            <section className="mt-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  使用したスキンケア
                </h3>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {getTextOrFallback(record.skincare_used)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">メモ</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {getTextOrFallback(record.memo)}
                </p>
              </div>
            </section>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                href={`/records/${record.id}/edit`}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
              >
                編集する
              </Link>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}
