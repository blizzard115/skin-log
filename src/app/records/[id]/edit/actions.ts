"use server";

import { revalidatePath } from "next/cache";
import { getRecordDateValidationError } from "@/lib/record-date";
import { validateOptionalSkinRecordPhotoFile } from "@/lib/skin-record-photo";
import {
  getOptionalSkinRecordPhotoFile,
  removeSkinRecordPhoto,
  uploadSkinRecordPhoto,
} from "@/lib/supabase/skin-record-photos";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OverallCondition = "" | "1" | "2" | "3" | "4" | "5";
type ConcernLevel = "" | "なし" | "少し" | "気になる" | "強い";

export type SkinRecordEditInput = {
  recordId: number;
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

type UpdateSkinRecordResult =
  | {
      success: true;
      redirectTo: string;
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

function isValidRecordId(recordId: number) {
  return Number.isSafeInteger(recordId) && recordId > 0;
}

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getSkinRecordInput(formData: FormData): SkinRecordEditInput {
  return {
    recordId: Number(getStringFormValue(formData, "recordId")),
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

export async function updateSkinRecord(
  formData: FormData,
): Promise<UpdateSkinRecordResult> {
  const input = getSkinRecordInput(formData);
  const photoFile = getOptionalSkinRecordPhotoFile(formData.get("photo"));
  const removePhoto = getStringFormValue(formData, "removePhoto") === "true";
  const fieldErrors: SkinRecordFieldErrors = {};

  if (!isValidRecordId(input.recordId)) {
    return {
      success: false,
      message: "肌記録を更新できませんでした。画面を開き直してもう一度お試しください。",
    };
  }

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

  if (removePhoto && photoFile) {
    fieldErrors.photo =
      "写真を削除する場合は、新しい写真の選択を解除してください。";
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
      message: "ログインが必要です。ログインし直してから更新してください。",
    };
  }

  if (!userId) {
    return {
      success: false,
      message: "ログインが必要です。ログインし直してから更新してください。",
    };
  }

  let uploadedPhotoPath: string | null = null;
  let previousPhotoPathToRemove: string | null = null;

  try {
    const { data: existingRecord, error: existingRecordError } = await supabase
      .from("skin_records")
      .select("id, photo_path")
      .eq("id", input.recordId)
      .eq("user_id", userId)
      .maybeSingle()
      .returns<{ id: number; photo_path: string | null } | null>();

    if (existingRecordError || !existingRecord) {
      return {
        success: false,
        message: "肌記録を更新できませんでした。時間をおいてもう一度お試しください。",
      };
    }

    const updateValues: {
      record_date: string;
      overall_condition: number;
      redness: ConcernLevel | null;
      dryness: ConcernLevel | null;
      acne: ConcernLevel | null;
      oiliness: ConcernLevel | null;
      skincare_used: string;
      memo: string;
      photo_path?: string | null;
    } = {
      record_date: input.recordDate,
      overall_condition: Number(input.overallCondition),
      redness: toNullableConcernLevel(input.redness),
      dryness: toNullableConcernLevel(input.dryness),
      acne: toNullableConcernLevel(input.acne),
      oiliness: toNullableConcernLevel(input.oiliness),
      skincare_used: input.skincareUsed,
      memo: input.memo,
    };

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
      updateValues.photo_path = uploadedPhotoPath;
    } else if (removePhoto) {
      updateValues.photo_path = null;
    }

    const { data: updatedRecord, error } = await supabase
      .from("skin_records")
      .update(updateValues)
      .eq("id", input.recordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle()
      .returns<{ id: number } | null>();

    if (error || !updatedRecord) {
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
        message: "肌記録を更新できませんでした。時間をおいてもう一度お試しください。",
      };
    }

    if ((uploadedPhotoPath || removePhoto) && existingRecord.photo_path) {
      previousPhotoPathToRemove = existingRecord.photo_path;
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
      message: "肌記録を更新できませんでした。時間をおいてもう一度お試しください。",
    };
  }

  if (previousPhotoPathToRemove) {
    try {
      const removeResult = await removeSkinRecordPhoto({
        supabase,
        userId,
        photoPath: previousPhotoPathToRemove,
      });

      if (!removeResult.success) {
        console.error("Failed to remove previous skin record photo.", {
          errorName: removeResult.errorName,
        });
      }
    } catch (error) {
      console.error("Unexpected error while removing previous skin record photo.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  try {
    revalidatePath("/records");
    revalidatePath(`/records/${input.recordId}`);
    revalidatePath("/records/trends");
  } catch (error) {
    console.error("Failed to revalidate skin record paths after update.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return {
    success: true,
    redirectTo: `/records/${input.recordId}`,
  };
}
