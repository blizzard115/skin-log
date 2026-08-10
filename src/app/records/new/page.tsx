import type { Metadata } from "next";
import Link from "next/link";
import { SkinRecordForm } from "./skin-record-form";

export const metadata: Metadata = {
  title: "今日の肌を記録 | SkinLog",
  description: "SkinLogで今日の肌状態と使用したスキンケアを記録する画面です。",
};

export default function NewRecordPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 lg:py-10">
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
                今日の肌を記録
              </h1>
              <p className="text-base leading-7 text-slate-600">
                今日の肌状態と使ったスキンケアを残して、あとから変化を振り返れるようにします。
              </p>
            </div>
          </div>
        </header>

        <SkinRecordForm />
      </div>
    </main>
  );
}
