import {
  createSkinRecordPhotoPath,
  isSkinRecordPhotoPathOwnedByUser,
  skinRecordPhotoBucket,
  validateOptionalSkinRecordPhotoFile,
} from "@/lib/skin-record-photo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type UploadSkinRecordPhotoResult =
  | {
      success: true;
      photoPath: string;
    }
  | {
      success: false;
      message: string;
      errorName?: string;
    };

type RemoveSkinRecordPhotoResult =
  | {
      success: true;
    }
  | {
      success: false;
      errorName?: string;
    };

export function getOptionalSkinRecordPhotoFile(
  value: FormDataEntryValue | null,
): File | undefined {
  if (!(value instanceof File)) {
    return undefined;
  }

  if (value.size === 0 && value.name === "") {
    return undefined;
  }

  return value;
}

export async function uploadSkinRecordPhoto({
  supabase,
  userId,
  photoFile,
}: {
  supabase: SupabaseServerClient;
  userId: string;
  photoFile: File;
}): Promise<UploadSkinRecordPhotoResult> {
  const validationResult = validateOptionalSkinRecordPhotoFile(photoFile);

  if (!validationResult.ok) {
    return {
      success: false,
      message: validationResult.message,
    };
  }

  if (!validationResult.hasFile) {
    return {
      success: false,
      message: "写真ファイルを選択し直してください",
    };
  }

  const photoPath = createSkinRecordPhotoPath({
    userId,
    mimeType: validationResult.mimeType,
  });

  const { error } = await supabase.storage
    .from(skinRecordPhotoBucket)
    .upload(photoPath, photoFile, {
      cacheControl: "3600",
      contentType: validationResult.mimeType,
      upsert: false,
    });

  if (error) {
    return {
      success: false,
      message: "写真をアップロードできませんでした。時間をおいてもう一度お試しください。",
      errorName: error.name,
    };
  }

  return {
    success: true,
    photoPath,
  };
}

export async function removeSkinRecordPhoto({
  supabase,
  userId,
  photoPath,
}: {
  supabase: SupabaseServerClient;
  userId: string;
  photoPath: string;
}): Promise<RemoveSkinRecordPhotoResult> {
  if (!isSkinRecordPhotoPathOwnedByUser({ userId, photoPath })) {
    return { success: false, errorName: "InvalidPhotoPath" };
  }

  const { error } = await supabase.storage
    .from(skinRecordPhotoBucket)
    .remove([photoPath]);

  if (error) {
    return {
      success: false,
      errorName: error.name,
    };
  }

  return { success: true };
}

export async function createSkinRecordPhotoSignedUrl({
  supabase,
  userId,
  photoPath,
  expiresIn = 300,
}: {
  supabase: SupabaseServerClient;
  userId: string;
  photoPath: string;
  expiresIn?: number;
}): Promise<string | undefined> {
  if (!isSkinRecordPhotoPathOwnedByUser({ userId, photoPath })) {
    return undefined;
  }

  try {
    const { data, error } = await supabase.storage
      .from(skinRecordPhotoBucket)
      .createSignedUrl(photoPath, expiresIn);

    if (error) {
      return undefined;
    }

    return data.signedUrl;
  } catch {
    return undefined;
  }
}
