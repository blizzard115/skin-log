import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { getTodayInJapan } from "@/lib/record-date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SkinRecordForm } from "./skin-record-form";

export const metadata: Metadata = {
  title: "今日の肌を記録 | SkinLog",
  description: "SkinLogで今日の肌状態と使用したスキンケアを記録する画面です。",
};

type NewRecordPageProps = {
  searchParams: Promise<{
    auth?: string | string[];
  }>;
};

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAuthNoticeMessage(auth: string | undefined) {
  if (auth === "login") {
    return "ログインしました";
  }

  if (auth === "signup") {
    return "新規登録しました";
  }

  return undefined;
}

export default async function NewRecordPage({
  searchParams,
}: NewRecordPageProps) {
  const { auth } = await searchParams;
  const supabase = await createSupabaseServerClient();
  let isLoggedIn = false;

  try {
    const { data } = await supabase.auth.getClaims();
    isLoggedIn = Boolean(data?.claims);
  } catch {
    isLoggedIn = false;
  }

  if (!isLoggedIn) {
    redirect("/auth/login");
  }

  const authNoticeMessage = getAuthNoticeMessage(getFirstSearchParam(auth));
  const maxRecordDate = getTodayInJapan();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 lg:py-10">
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

          <div className="space-y-3">
            <p className="inline-flex rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              SkinLog
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                今日の肌を記録
              </h1>
              <p className="text-base leading-7 text-slate-600">
                今日の肌状態と使ったスキンケアを残して、あとから変化を振り返れるようにします。
              </p>
            </div>
          </div>
        </header>

        {authNoticeMessage ? (
          <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {authNoticeMessage}
          </p>
        ) : null}

        <SkinRecordForm maxRecordDate={maxRecordDate} />
      </div>
    </main>
  );
}
