"use server";

import { revalidatePath } from "next/cache";
import { removeSkinRecordPhoto } from "@/lib/supabase/skin-record-photos";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DeleteSkinRecordResult =
  | {
      success: true;
      redirectTo: string;
    }
  | {
      success: false;
      message: string;
    };

function isValidRecordId(recordId: number) {
  return Number.isSafeInteger(recordId) && recordId > 0;
}

export async function deleteSkinRecord(
  recordId: number,
): Promise<DeleteSkinRecordResult> {
  if (!isValidRecordId(recordId)) {
    return {
      success: false,
      message: "肌記録を削除できませんでした。画面を開き直してもう一度お試しください。",
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
      message: "ログインが必要です。ログインし直してから削除してください。",
    };
  }

  if (!userId) {
    return {
      success: false,
      message: "ログインが必要です。ログインし直してから削除してください。",
    };
  }

  let deletedPhotoPath: string | null = null;

  try {
    const { data: deletedRecord, error } = await supabase
      .from("skin_records")
      .delete()
      .eq("id", recordId)
      .eq("user_id", userId)
      .select("id, photo_path")
      .maybeSingle()
      .returns<{ id: number; photo_path: string | null } | null>();

    if (error) {
      console.error("Failed to delete skin record.", { code: error.code });

      return {
        success: false,
        message: "肌記録を削除できませんでした。時間をおいてもう一度お試しください。",
      };
    }

    if (!deletedRecord) {
      return {
        success: false,
        message: "肌記録を削除できませんでした。画面を更新してもう一度お試しください。",
      };
    }

    deletedPhotoPath = deletedRecord.photo_path;
  } catch (error) {
    console.error("Unexpected error while deleting skin record.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return {
      success: false,
      message: "肌記録を削除できませんでした。時間をおいてもう一度お試しください。",
    };
  }

  if (deletedPhotoPath) {
    try {
      const removeResult = await removeSkinRecordPhoto({
        supabase,
        userId,
        photoPath: deletedPhotoPath,
      });

      if (!removeResult.success) {
        console.error("Failed to remove skin record photo after deletion.", {
          errorName: removeResult.errorName,
        });
      }
    } catch (error) {
      console.error("Unexpected error while removing skin record photo.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  try {
    revalidatePath("/records");
    revalidatePath(`/records/${recordId}`);
    revalidatePath("/records/trends");
  } catch (error) {
    console.error("Failed to revalidate skin record paths after deletion.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return {
    success: true,
    redirectTo: "/records",
  };
}
