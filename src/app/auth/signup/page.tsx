import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "../auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "新規登録 | SkinLog",
  description: "SkinLogへメールアドレスとパスワードで新規登録する画面です。",
};

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/records/new");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-6 sm:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5">
          <Link
            href="/"
            className="w-fit text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800"
          >
            ← トップページへ戻る
          </Link>

          <div className="space-y-3">
            <p className="inline-flex rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              SkinLog
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                新規登録
              </h1>
              <p className="text-base leading-7 text-slate-600">
                メールアドレスとパスワードでSkinLogのアカウントを作成します。
              </p>
            </div>
          </div>
        </header>

        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
