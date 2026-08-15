import { describe, expect, it } from "vitest";
import { getRecordDateValidationError, getTodayInJapan } from "./record-date";

describe("getTodayInJapan", () => {
  it("UTCで15時になる直前は日本時間の同じ日付を返す", () => {
    expect(getTodayInJapan(new Date("2026-08-14T14:59:59Z"))).toBe(
      "2026-08-14",
    );
  });

  it("UTCで15時になった瞬間は日本時間の翌日を返す", () => {
    expect(getTodayInJapan(new Date("2026-08-14T15:00:00Z"))).toBe(
      "2026-08-15",
    );
  });
});

describe("getRecordDateValidationError", () => {
  const todayInJapan = "2026-08-15";

  it("空欄を拒否する", () => {
    expect(getRecordDateValidationError("", todayInJapan)).toBe(
      "記録日を入力してください",
    );
  });

  it.each(["2026-8-14", "2026/08/14", "日付ではない文字列"])(
    "形式違いの値 %s を拒否する",
    (recordDate) => {
      expect(getRecordDateValidationError(recordDate, todayInJapan)).toBe(
        "記録日を正しい形式で入力してください",
      );
    },
  );

  it.each([
    "2026-02-29",
    "2026-02-31",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
    "0000-01-01",
  ])("実在しない日付 %s を拒否する", (recordDate) => {
    expect(getRecordDateValidationError(recordDate, todayInJapan)).toBe(
      "記録日を正しい日付で入力してください",
    );
  });

  it.each(["2028-02-29", "2000-02-29"])(
    "うるう年の2月29日 %s を許可する",
    (recordDate) => {
      expect(getRecordDateValidationError(recordDate, "2100-03-01")).toBe(
        undefined,
      );
    },
  );

  it("100で割り切れて400で割り切れない年の2月29日を拒否する", () => {
    expect(getRecordDateValidationError("2100-02-29", "2100-03-01")).toBe(
      "記録日を正しい日付で入力してください",
    );
  });

  it.each(["2026-08-14", "2026-08-15"])(
    "過去日と今日 %s を許可する",
    (recordDate) => {
      expect(getRecordDateValidationError(recordDate, todayInJapan)).toBe(
        undefined,
      );
    },
  );

  it("未来日を拒否する", () => {
    expect(getRecordDateValidationError("2026-08-16", todayInJapan)).toBe(
      "未来の日付は選択できません",
    );
  });
});
