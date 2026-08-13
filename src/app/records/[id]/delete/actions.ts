"use server";

import { revalidatePath } from "next/cache";
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

  try {
    const { data: deletedRecord, error } = await supabase
      .from("skin_records")
      .delete()
      .eq("id", recordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle()
      .returns<{ id: number } | null>();

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
  } catch (error) {
    console.error("Unexpected error while deleting skin record.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return {
      success: false,
      message: "肌記録を削除できませんでした。時間をおいてもう一度お試しください。",
    };
  }

  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);

  return {
    success: true,
    redirectTo: "/records",
  };
}
