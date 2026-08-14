"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecordDateValidationError } from "@/lib/record-date";

type OverallCondition = "" | "1" | "2" | "3" | "4" | "5";
type ConcernLevel = "" | "なし" | "少し" | "気になる" | "強い";

type SkinRecordInput = {
  recordDate: string;
  overallCondition: OverallCondition;
  redness: ConcernLevel;
  dryness: ConcernLevel;
  acne: ConcernLevel;
  oiliness: ConcernLevel;
  skincareUsed: string;
  memo: string;
};

type SkinRecordFieldErrors = {
  recordDate?: string;
  overallCondition?: string;
};

type SaveSkinRecordResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: SkinRecordFieldErrors;
    };

const validOverallConditions = ["1", "2", "3", "4", "5"];
const validConcernLevels = ["", "なし", "少し", "気になる", "強い"];

function isValidOverallCondition(value: string): value is OverallCondition {
  return validOverallConditions.includes(value);
}

function isValidConcernLevel(value: string): value is ConcernLevel {
  return validConcernLevels.includes(value);
}

function toNullableConcernLevel(value: ConcernLevel) {
  return value === "" ? null : value;
}

export async function saveSkinRecord(
  input: SkinRecordInput,
): Promise<SaveSkinRecordResult> {
  const fieldErrors: SkinRecordFieldErrors = {};
  const recordDateError = getRecordDateValidationError(input.recordDate);

  if (recordDateError) {
    fieldErrors.recordDate = recordDateError;
  }

  if (input.overallCondition === "") {
    fieldErrors.overallCondition = "肌の総合状態を選択してください";
  } else if (!isValidOverallCondition(input.overallCondition)) {
    fieldErrors.overallCondition = "肌の総合状態を選択し直してください";
  }

  const concernLevels = [
    input.redness,
    input.dryness,
    input.acne,
    input.oiliness,
  ];

  if (!concernLevels.every(isValidConcernLevel)) {
    return {
      success: false,
      message: "入力内容に不正な値があります。画面を再読み込みしてもう一度お試しください。",
    };
  }

  if (fieldErrors.recordDate || fieldErrors.overallCondition) {
    return {
      success: false,
      message: "入力内容を確認してください。",
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  let userId: string | undefined;

  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    userId = claimsData?.claims.sub;
  } catch {
    return {
      success: false,
      message: "ログインが必要です。ログインし直してから保存してください。",
    };
  }

  if (!userId) {
    return {
      success: false,
      message: "ログインが必要です。ログインし直してから保存してください。",
    };
  }

  try {
    const { error } = await supabase.from("skin_records").insert({
      user_id: userId,
      record_date: input.recordDate,
      overall_condition: Number(input.overallCondition),
      redness: toNullableConcernLevel(input.redness),
      dryness: toNullableConcernLevel(input.dryness),
      acne: toNullableConcernLevel(input.acne),
      oiliness: toNullableConcernLevel(input.oiliness),
      skincare_used: input.skincareUsed,
      memo: input.memo,
    });

    if (error) {
      return {
        success: false,
        message: "肌記録を保存できませんでした。時間をおいてもう一度お試しください。",
      };
    }

    return {
      success: true,
      message: "肌記録を保存しました",
    };
  } catch {
    return {
      success: false,
      message: "肌記録を保存できませんでした。時間をおいてもう一度お試しください。",
    };
  }
}
