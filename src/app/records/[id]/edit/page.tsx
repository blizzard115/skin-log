import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SkinRecordEditForm } from "./skin-record-edit-form";

type ConcernLevel = "なし" | "少し" | "気になる" | "強い" | null;
type EditConcernLevel = "" | "なし" | "少し" | "気になる" | "強い";
type EditOverallCondition = "1" | "2" | "3" | "4" | "5";

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
};

type RecordEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "肌記録を編集 | SkinLog",
  description: "SkinLogで保存済みの肌記録を編集する画面です。",
};

function parseRecordId(id: string) {
  if (!/^\d+$/.test(id)) {
    return undefined;
  }

  const recordId = Number(id);
  return Number.isSafeInteger(recordId) && recordId > 0 ? recordId : undefined;
}

function toEditOverallCondition(
  overallCondition: number,
): EditOverallCondition | undefined {
  if (
    overallCondition === 1 ||
    overallCondition === 2 ||
    overallCondition === 3 ||
    overallCondition === 4 ||
    overallCondition === 5
  ) {
    return String(overallCondition) as EditOverallCondition;
  }

  return undefined;
}

function toEditConcernLevel(value: ConcernLevel): EditConcernLevel {
  return value ?? "";
}

function getTextOrEmpty(value: string | null) {
  return value ?? "";
}

export default async function RecordEditPage({
  params,
}: RecordEditPageProps) {
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
      "id, record_date, overall_condition, redness, dryness, acne, oiliness, skincare_used, memo",
    )
    .eq("id", recordId)
    .eq("user_id", userId)
    .maybeSingle()
    .returns<SkinRecord | null>();

  if (!record && !error) {
    notFound();
  }

  const overallCondition = record
    ? toEditOverallCondition(record.overall_condition)
    : undefined;

  if (record && !overallCondition) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/records/${recordId}`}
              className="w-fit text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800"
            >
              ← 詳細へ戻る
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

          <div className="space-y-3">
            <p className="inline-flex rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              SkinLog
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                肌記録を編集
              </h1>
              <p className="text-base leading-7 text-slate-600">
                保存済みの肌状態と使用したスキンケアの内容を更新します。
              </p>
            </div>
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

        {!error && record && overallCondition ? (
          <SkinRecordEditForm
            recordId={record.id}
            initialValues={{
              recordDate: record.record_date,
              overallCondition,
              redness: toEditConcernLevel(record.redness),
              dryness: toEditConcernLevel(record.dryness),
              acne: toEditConcernLevel(record.acne),
              oiliness: toEditConcernLevel(record.oiliness),
              skincareUsed: getTextOrEmpty(record.skincare_used),
              memo: getTextOrEmpty(record.memo),
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
