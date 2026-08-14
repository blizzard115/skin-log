"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { getRecordDateValidationError } from "@/lib/record-date";
import { updateSkinRecord, type SkinRecordEditInput } from "./actions";

type OverallCondition = SkinRecordEditInput["overallCondition"];
type SelectedOverallCondition = Exclude<OverallCondition, "">;

type ConcernLevel = SkinRecordEditInput["redness"];
type SelectedConcernLevel = Exclude<ConcernLevel, "">;
type ConcernFieldName = "redness" | "dryness" | "acne" | "oiliness";

type SkinRecordEditFormValues = Omit<SkinRecordEditInput, "recordId">;

type SkinRecordEditFormErrors = {
  recordDate?: string;
  overallCondition?: string;
};

type SkinRecordEditFormProps = {
  recordId: number;
  maxRecordDate: string;
  initialValues: SkinRecordEditFormValues;
};

const conditionOptions: {
  value: SelectedOverallCondition;
  label: string;
  description: string;
}[] = [
  { value: "1", label: "1", description: "かなり不調" },
  { value: "2", label: "2", description: "少し不調" },
  { value: "3", label: "3", description: "普通" },
  { value: "4", label: "4", description: "良い" },
  { value: "5", label: "5", description: "とても良い" },
];

const concernOptions: SelectedConcernLevel[] = [
  "なし",
  "少し",
  "気になる",
  "強い",
];

const concernFields: { id: ConcernFieldName; label: string }[] = [
  { id: "redness", label: "赤み" },
  { id: "dryness", label: "乾燥" },
  { id: "acne", label: "ニキビ" },
  { id: "oiliness", label: "皮脂" },
];

const inputClassName =
  "mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

const textareaClassName =
  "mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base leading-7 text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

export function SkinRecordEditForm({
  recordId,
  maxRecordDate,
  initialValues,
}: SkinRecordEditFormProps) {
  const router = useRouter();
  const [formValues, setFormValues] =
    useState<SkinRecordEditFormValues>(initialValues);
  const [errors, setErrors] = useState<SkinRecordEditFormErrors>({});
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <FieldName extends keyof SkinRecordEditFormValues>(
    fieldName: FieldName,
    value: SkinRecordEditFormValues[FieldName],
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setSubmitErrorMessage("");

    if (fieldName === "recordDate" && value !== "") {
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.recordDate;
        return nextErrors;
      });
    }

    if (fieldName === "overallCondition" && value !== "") {
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.overallCondition;
        return nextErrors;
      });
    }
  };

  const handleRecordDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateField("recordDate", event.target.value);
  };

  const handleOverallConditionChange = (value: SelectedOverallCondition) => {
    updateField("overallCondition", value);
  };

  const handleConcernChange = (
    fieldName: ConcernFieldName,
    value: SelectedConcernLevel,
  ) => {
    updateField(fieldName, value);
  };

  const handleTextareaChange =
    (fieldName: "skincareUsed" | "memo") =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      updateField(fieldName, event.target.value);
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const nextErrors: SkinRecordEditFormErrors = {};
    const recordDateError = getRecordDateValidationError(
      formValues.recordDate,
      maxRecordDate,
    );

    if (recordDateError) {
      nextErrors.recordDate = recordDateError;
    }

    if (formValues.overallCondition === "") {
      nextErrors.overallCondition = "肌の総合状態を選択してください";
    }

    setErrors(nextErrors);
    setSubmitErrorMessage("");

    if (nextErrors.recordDate || nextErrors.overallCondition) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateSkinRecord({
        recordId,
        ...formValues,
      });

      if (result.success) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setErrors(result.fieldErrors ?? {});
      setSubmitErrorMessage(result.message);
    } catch {
      setSubmitErrorMessage(
        "肌記録を更新できませんでした。時間をおいてもう一度お試しください。",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
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
            max={maxRecordDate}
            value={formValues.recordDate}
            onChange={handleRecordDateChange}
            aria-invalid={Boolean(errors.recordDate)}
            aria-describedby={
              errors.recordDate ? "record-date-error" : undefined
            }
            className={inputClassName}
          />
          {errors.recordDate ? (
            <p
              id="record-date-error"
              className="mt-2 text-sm font-medium text-red-600"
            >
              {errors.recordDate}
            </p>
          ) : null}
        </div>

        <fieldset
          aria-invalid={Boolean(errors.overallCondition)}
          aria-describedby={
            errors.overallCondition ? "overall-condition-error" : undefined
          }
        >
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
                  checked={formValues.overallCondition === option.value}
                  onChange={() => handleOverallConditionChange(option.value)}
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
          {errors.overallCondition ? (
            <p
              id="overall-condition-error"
              className="mt-2 text-sm font-medium text-red-600"
            >
              {errors.overallCondition}
            </p>
          ) : null}
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
                      checked={formValues[field.id] === option}
                      onChange={() => handleConcernChange(field.id, option)}
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
            value={formValues.skincareUsed}
            onChange={handleTextareaChange("skincareUsed")}
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
            value={formValues.memo}
            onChange={handleTextareaChange("memo")}
            className={textareaClassName}
            placeholder="例：寝不足、ひげ剃り後に赤みが出た、外出時間が長かった"
          />
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-fit"
          >
            {isSaving ? "更新中..." : "変更を保存する"}
          </button>
          <Link
            href={`/records/${recordId}`}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-200 hover:text-sky-700 sm:w-fit"
          >
            詳細へ戻る
          </Link>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          更新すると、ログイン中のアカウントに紐づくこの肌記録だけを書き換えます。
        </p>

        {submitErrorMessage ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submitErrorMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
