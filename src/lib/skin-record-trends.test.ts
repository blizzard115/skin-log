import { describe, expect, it } from "vitest";
import {
  getOverallConditionLabel,
  getRecentTrendRecordsForDisplay,
  type SkinRecordTrendSource,
} from "./skin-record-trends";

function createRecord(
  id: number,
  recordDate: string,
  overallCondition: number,
  createdAt = `${recordDate}T09:00:00.000Z`,
): SkinRecordTrendSource {
  return {
    id,
    record_date: recordDate,
    overall_condition: overallCondition,
    created_at: createdAt,
  };
}

describe("getOverallConditionLabel", () => {
  it.each([
    [1, "かなり不調"],
    [2, "少し不調"],
    [3, "普通"],
    [4, "良い"],
    [5, "とても良い"],
  ])("保存値 %i を表示ラベル %s に変換する", (value, label) => {
    expect(getOverallConditionLabel(value)).toBe(label);
  });

  it("想定外の保存値は不明として扱う", () => {
    expect(getOverallConditionLabel(0)).toBe("不明");
  });
});

describe("getRecentTrendRecordsForDisplay", () => {
  it("0件の場合は空配列を返す", () => {
    expect(getRecentTrendRecordsForDisplay([])).toEqual([]);
  });

  it("1件の場合も表示用ラベルとバー幅を付ける", () => {
    expect(getRecentTrendRecordsForDisplay([createRecord(1, "2026-08-10", 4)]))
      .toEqual([
        {
          id: 1,
          record_date: "2026-08-10",
          overall_condition: 4,
          created_at: "2026-08-10T09:00:00.000Z",
          overallConditionLabel: "良い",
          overallConditionPercent: 80,
        },
      ]);
  });

  it("7件の場合は古い日付から新しい日付の順に並べる", () => {
    const records = [
      createRecord(7, "2026-08-07", 5),
      createRecord(1, "2026-08-01", 1),
      createRecord(4, "2026-08-04", 4),
      createRecord(2, "2026-08-02", 2),
      createRecord(6, "2026-08-06", 1),
      createRecord(3, "2026-08-03", 3),
      createRecord(5, "2026-08-05", 5),
    ];

    expect(getRecentTrendRecordsForDisplay(records).map((record) => record.id))
      .toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("8件以上の場合は最新7件だけを古い順にする", () => {
    const records = [
      createRecord(1, "2026-08-01", 1),
      createRecord(2, "2026-08-02", 2),
      createRecord(3, "2026-08-03", 3),
      createRecord(4, "2026-08-04", 4),
      createRecord(5, "2026-08-05", 5),
      createRecord(6, "2026-08-06", 1),
      createRecord(7, "2026-08-07", 2),
      createRecord(8, "2026-08-08", 3),
    ];

    expect(getRecentTrendRecordsForDisplay(records).map((record) => record.id))
      .toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it("同じ記録日は保存日時とidで順序を安定させる", () => {
    const records = [
      createRecord(3, "2026-08-15", 3, "2026-08-15T12:00:00.000Z"),
      createRecord(1, "2026-08-15", 1, "2026-08-15T09:00:00.000Z"),
      createRecord(2, "2026-08-15", 2, "2026-08-15T09:00:00.000Z"),
    ];

    expect(getRecentTrendRecordsForDisplay(records).map((record) => record.id))
      .toEqual([1, 2, 3]);
  });
});
