export const skinRecordPhotoBucket = "skin-record-photos";
export const skinRecordPhotoMaxSizeBytes = 3 * 1024 * 1024;

export const skinRecordPhotoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const skinRecordPhotoInputAccept = skinRecordPhotoMimeTypes.join(",");

export type SkinRecordPhotoMimeType = (typeof skinRecordPhotoMimeTypes)[number];

type SkinRecordPhotoExtension = "jpg" | "png" | "webp";

type SkinRecordPhotoCandidate = {
  size: number;
  type: string;
};

type SkinRecordPhotoValidationResult =
  | {
      ok: true;
      hasFile: false;
    }
  | {
      ok: true;
      hasFile: true;
      mimeType: SkinRecordPhotoMimeType;
      extension: SkinRecordPhotoExtension;
    }
  | {
      ok: false;
      message: string;
    };

const mimeTypeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} satisfies Record<SkinRecordPhotoMimeType, SkinRecordPhotoExtension>;

export function getSkinRecordPhotoExtension(
  mimeType: string,
): SkinRecordPhotoExtension | undefined {
  if (Object.prototype.hasOwnProperty.call(mimeTypeExtensions, mimeType)) {
    return mimeTypeExtensions[mimeType as SkinRecordPhotoMimeType];
  }

  return undefined;
}

export function validateOptionalSkinRecordPhotoFile(
  file: SkinRecordPhotoCandidate | null | undefined,
): SkinRecordPhotoValidationResult {
  if (!file) {
    return { ok: true, hasFile: false };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      message: "写真ファイルを選択し直してください",
    };
  }

  if (file.size > skinRecordPhotoMaxSizeBytes) {
    return {
      ok: false,
      message: "写真は3MB以内の画像を選択してください",
    };
  }

  const extension = getSkinRecordPhotoExtension(file.type);

  if (!extension) {
    return {
      ok: false,
      message: "写真はJPEG・PNG・WebP形式を選択してください",
    };
  }

  return {
    ok: true,
    hasFile: true,
    mimeType: file.type as SkinRecordPhotoMimeType,
    extension,
  };
}

export function createSkinRecordPhotoPath({
  userId,
  mimeType,
  randomId = crypto.randomUUID(),
}: {
  userId: string;
  mimeType: SkinRecordPhotoMimeType;
  randomId?: string;
}): string {
  const extension = getSkinRecordPhotoExtension(mimeType);

  if (!extension) {
    throw new Error("Unsupported skin record photo MIME type");
  }

  return `${userId}/${randomId}.${extension}`;
}

export function isSkinRecordPhotoPathOwnedByUser({
  userId,
  photoPath,
}: {
  userId: string;
  photoPath: string;
}): boolean {
  const [folderName, fileName, ...rest] = photoPath.split("/");

  return folderName === userId && Boolean(fileName) && rest.length === 0;
}
