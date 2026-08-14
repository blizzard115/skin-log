const japanTimeZone = "Asia/Tokyo";
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayInJapan(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: japanTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format today's date in Japan time.");
  }

  return `${year}-${month}-${day}`;
}

export function getRecordDateValidationError(
  recordDate: string,
  todayInJapan = getTodayInJapan(),
) {
  if (recordDate === "") {
    return "記録日を入力してください";
  }

  if (!isoDatePattern.test(recordDate)) {
    return "記録日を正しい形式で入力してください";
  }

  if (!isExistingIsoDate(recordDate)) {
    return "記録日を正しい日付で入力してください";
  }

  if (recordDate > todayInJapan) {
    return "未来の日付は選択できません";
  }

  return undefined;
}

function isExistingIsoDate(recordDate: string) {
  const [yearText, monthText, dayText] = recordDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  return day <= getDaysInMonth(year, month);
}

function getDaysInMonth(year: number, month: number) {
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return daysInMonth[month - 1] ?? 0;
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}
