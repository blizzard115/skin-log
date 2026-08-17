export const skinRecordTrendLimit = 7;

export type SkinRecordTrendSource = {
  id: number;
  record_date: string;
  overall_condition: number;
  created_at: string;
};

export type SkinRecordTrendItem = SkinRecordTrendSource & {
  overallConditionLabel: string;
  overallConditionPercent: number;
};

const overallConditionLabels = {
  1: "かなり不調",
  2: "少し不調",
  3: "普通",
  4: "良い",
  5: "とても良い",
} as const;

export function getOverallConditionLabel(overallCondition: number) {
  if (isOverallConditionValue(overallCondition)) {
    return overallConditionLabels[overallCondition];
  }

  return "不明";
}

export function getRecentTrendRecordsForDisplay(
  records: SkinRecordTrendSource[],
  limit = skinRecordTrendLimit,
): SkinRecordTrendItem[] {
  return [...records]
    .sort(compareRecordsLatestFirst)
    .slice(0, limit)
    .sort(compareRecordsOldestFirst)
    .map((record) => ({
      ...record,
      overallConditionLabel: getOverallConditionLabel(
        record.overall_condition,
      ),
      overallConditionPercent: getOverallConditionPercent(
        record.overall_condition,
      ),
    }));
}

function isOverallConditionValue(
  overallCondition: number,
): overallCondition is keyof typeof overallConditionLabels {
  return (
    overallCondition === 1 ||
    overallCondition === 2 ||
    overallCondition === 3 ||
    overallCondition === 4 ||
    overallCondition === 5
  );
}

function getOverallConditionPercent(overallCondition: number) {
  if (!isOverallConditionValue(overallCondition)) {
    return 0;
  }

  return (overallCondition / 5) * 100;
}

function compareRecordsLatestFirst(
  current: SkinRecordTrendSource,
  next: SkinRecordTrendSource,
) {
  const recordDateComparison = next.record_date.localeCompare(
    current.record_date,
  );

  if (recordDateComparison !== 0) {
    return recordDateComparison;
  }

  const createdAtComparison = next.created_at.localeCompare(
    current.created_at,
  );

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return next.id - current.id;
}

function compareRecordsOldestFirst(
  current: SkinRecordTrendSource,
  next: SkinRecordTrendSource,
) {
  const recordDateComparison = current.record_date.localeCompare(
    next.record_date,
  );

  if (recordDateComparison !== 0) {
    return recordDateComparison;
  }

  const createdAtComparison = current.created_at.localeCompare(
    next.created_at,
  );

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return current.id - next.id;
}
