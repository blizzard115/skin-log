import { describe, expect, it } from "vitest";

import {
  createSkinRecordPhotoPath,
  getSkinRecordPhotoExtension,
  isSkinRecordPhotoPathOwnedByUser,
  skinRecordPhotoMaxSizeBytes,
  validateOptionalSkinRecordPhotoFile,
} from "./skin-record-photo";

describe("validateOptionalSkinRecordPhotoFile", () => {
  it("写真未選択を許可する", () => {
    expect(validateOptionalSkinRecordPhotoFile(undefined)).toEqual({
      ok: true,
      hasFile: false,
    });
  });

  it("JPEG、PNG、WebPを許可する", () => {
    expect(
      validateOptionalSkinRecordPhotoFile({ size: 1024, type: "image/jpeg" }),
    ).toMatchObject({ ok: true, hasFile: true, extension: "jpg" });
    expect(
      validateOptionalSkinRecordPhotoFile({ size: 1024, type: "image/png" }),
    ).toMatchObject({ ok: true, hasFile: true, extension: "png" });
    expect(
      validateOptionalSkinRecordPhotoFile({ size: 1024, type: "image/webp" }),
    ).toMatchObject({ ok: true, hasFile: true, extension: "webp" });
  });

  it("3MBちょうどの写真を許可する", () => {
    expect(
      validateOptionalSkinRecordPhotoFile({
        size: skinRecordPhotoMaxSizeBytes,
        type: "image/jpeg",
      }),
    ).toMatchObject({ ok: true, hasFile: true });
  });

  it("3MBを超える写真を拒否する", () => {
    expect(
      validateOptionalSkinRecordPhotoFile({
        size: skinRecordPhotoMaxSizeBytes + 1,
        type: "image/jpeg",
      }),
    ).toEqual({
      ok: false,
      message: "写真は3MB以内の画像を選択してください",
    });
  });

  it("許可されていないMIME typeを拒否する", () => {
    for (const type of ["image/gif", "image/svg+xml", "application/pdf", ""]) {
      expect(validateOptionalSkinRecordPhotoFile({ size: 1024, type })).toEqual({
        ok: false,
        message: "写真はJPEG・PNG・WebP形式を選択してください",
      });
    }
  });
});

describe("getSkinRecordPhotoExtension", () => {
  it("MIME typeに対応した安全な拡張子を返す", () => {
    expect(getSkinRecordPhotoExtension("image/jpeg")).toBe("jpg");
    expect(getSkinRecordPhotoExtension("image/png")).toBe("png");
    expect(getSkinRecordPhotoExtension("image/webp")).toBe("webp");
    expect(getSkinRecordPhotoExtension("image/gif")).toBeUndefined();
  });
});

describe("createSkinRecordPhotoPath", () => {
  it("ユーザーIDを先頭フォルダにし、元のファイル名を使わない", () => {
    const path = createSkinRecordPhotoPath({
      userId: "user-123",
      mimeType: "image/png",
      randomId: "generated-id",
    });

    expect(path).toBe("user-123/generated-id.png");
    expect(path).not.toContain("original-face-photo");
  });
});

describe("isSkinRecordPhotoPathOwnedByUser", () => {
  it("本人フォルダ配下の写真パスだけを本人所有として扱う", () => {
    expect(
      isSkinRecordPhotoPathOwnedByUser({
        userId: "user-123",
        photoPath: "user-123/photo.jpg",
      }),
    ).toBe(true);

    expect(
      isSkinRecordPhotoPathOwnedByUser({
        userId: "user-123",
        photoPath: "other-user/photo.jpg",
      }),
    ).toBe(false);

    expect(
      isSkinRecordPhotoPathOwnedByUser({
        userId: "user-123",
        photoPath: "user-123/nested/photo.jpg",
      }),
    ).toBe(false);
  });
});
