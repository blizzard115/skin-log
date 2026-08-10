import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "今日の肌を記録 | SkinLog",
  description: "SkinLogで今日の肌状態と使用したスキンケアを記録する画面です。",
};

const conditionOptions = [
  { value: "1", label: "1", description: "かなり不調" },
  { value: "2", label: "2", description: "少し不調" },
  { value: "3", label: "3", description: "普通" },
  { value: "4", label: "4", description: "良い" },
  { value: "5", label: "5", description: "とても良い" },
];

const concernOptions = ["なし", "少し", "気になる", "強い"];

const concernFields = [
  { id: "redness", label: "赤み" },
  { id: "dryness", label: "乾燥" },
  { id: "acne", label: "ニキビ" },
  { id: "oiliness", label: "皮脂" },
];

const inputClassName =
  "mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

const textareaClassName =
  "mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base leading-7 text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

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

        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="space-y-8">
            <div>
              <label
                htmlFor="record-date"
                className="text-sm font-semibold text-slate-900"
              >
                記録日
              </label>
              <input
                id="record-date"
                name="recordDate"
                type="date"
                className={inputClassName}
              />
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-900">
                肌の総合状態
              </legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {conditionOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors has-checked:border-sky-500 has-checked:bg-sky-50"
                  >
                    <input
                      type="radio"
                      name="overallCondition"
                      value={option.value}
                      className="h-5 w-5 accent-sky-600"
                    />
                    <span>
                      <span className="block text-base font-semibold">
                        {option.label}
                      </span>
                      <span className="block text-xs font-medium text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-6">
              {concernFields.map((field) => (
                <fieldset key={field.id}>
                  <legend className="text-sm font-semibold text-slate-900">
                    {field.label}
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {concernOptions.map((option) => (
                      <label
                        key={`${field.id}-${option}`}
                        className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition-colors has-checked:border-sky-500 has-checked:bg-sky-50 has-checked:text-sky-800"
                      >
                        <input
                          type="radio"
                          name={field.id}
                          value={option}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <div>
              <label
                htmlFor="skincare-used"
                className="text-sm font-semibold text-slate-900"
              >
                使用したスキンケア
              </label>
              <textarea
                id="skincare-used"
                name="skincareUsed"
                className={textareaClassName}
                placeholder="例：洗顔料、化粧水、乳液、日焼け止め"
              />
            </div>

            <div>
              <label
                htmlFor="memo"
                className="text-sm font-semibold text-slate-900"
              >
                メモ
              </label>
              <textarea
                id="memo"
                name="memo"
                className={textareaClassName}
                placeholder="例：寝不足、ひげ剃り後に赤みが出た、外出時間が長かった"
              />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-fit"
            >
              記録を保存する
            </button>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              保存機能はまだ未実装です。今は画面の見た目と入力項目だけを確認できます。
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
