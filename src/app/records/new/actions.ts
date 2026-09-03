"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecordDateValidationError } from "@/lib/record-date";
import { validateOptionalSkinRecordPhotoFile } from "@/lib/skin-record-photo";
import {
  getOptionalSkinRecordPhotoFile,
  removeSkinRecordPhoto,
  uploadSkinRecordPhoto,
} from "@/lib/supabase/skin-record-photos";

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
  photo?: string;
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

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getSkinRecordInput(formData: FormData): SkinRecordInput {
  return {
    recordDate: getStringFormValue(formData, "recordDate"),
    overallCondition: getStringFormValue(
      formData,
      "overallCondition",
    ) as OverallCondition,
    redness: getStringFormValue(formData, "redness") as ConcernLevel,
    dryness: getStringFormValue(formData, "dryness") as ConcernLevel,
    acne: getStringFormValue(formData, "acne") as ConcernLevel,
    oiliness: getStringFormValue(formData, "oiliness") as ConcernLevel,
    skincareUsed: getStringFormValue(formData, "skincareUsed"),
    memo: getStringFormValue(formData, "memo"),
  };
}

export async function saveSkinRecord(
  formData: FormData,
): Promise<SaveSkinRecordResult> {
  const input = getSkinRecordInput(formData);
  const photoFile = getOptionalSkinRecordPhotoFile(formData.get("photo"));
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

  const photoValidationResult = validateOptionalSkinRecordPhotoFile(photoFile);

  if (!photoValidationResult.ok) {
    fieldErrors.photo = photoValidationResult.message;
  }

  if (
    fieldErrors.recordDate ||
    fieldErrors.overallCondition ||
    fieldErrors.photo
  ) {
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

  let uploadedPhotoPath: string | null = null;

  try {
    if (photoFile) {
      const uploadResult = await uploadSkinRecordPhoto({
        supabase,
        userId,
        photoFile,
      });

      if (!uploadResult.success) {
        return {
          success: false,
          message: uploadResult.message,
          fieldErrors: {
            photo: uploadResult.message,
          },
        };
      }

      uploadedPhotoPath = uploadResult.photoPath;
    }

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
      photo_path: uploadedPhotoPath,
    });

    if (error) {
      if (uploadedPhotoPath) {
        const removeResult = await removeSkinRecordPhoto({
          supabase,
          userId,
          photoPath: uploadedPhotoPath,
        });

        if (!removeResult.success) {
          console.error("Failed to remove uploaded skin record photo.", {
            errorName: removeResult.errorName,
          });
        }
      }

      return {
        success: false,
        message: "肌記録を保存できませんでした。時間をおいてもう一度お試しください。",
      };
    }

  } catch {
    if (uploadedPhotoPath) {
      const removeResult = await removeSkinRecordPhoto({
        supabase,
        userId,
        photoPath: uploadedPhotoPath,
      });

      if (!removeResult.success) {
        console.error("Failed to remove uploaded skin record photo.", {
          errorName: removeResult.errorName,
        });
      }
    }

    return {
      success: false,
      message: "肌記録を保存できませんでした。時間をおいてもう一度お試しください。",
    };
  }

  try {
    revalidatePath("/records");
    revalidatePath("/records/trends");
  } catch (error) {
    console.error("Failed to revalidate skin record paths after save.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return {
    success: true,
    message: "肌記録を保存しました",
  };
}
