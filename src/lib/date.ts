import dayjs from "dayjs";

export function isValidDateString(value: string): boolean {
  return dayjs(value, "YYYY-MM-DD", true).isValid();
}

export function monthRange(month: string): { from: string; to: string } {
  const start = dayjs(`${month}-01`).startOf("month");
  const end = start.endOf("month");
  return {
    from: start.format("YYYY-MM-DD"),
    to: end.format("YYYY-MM-DD"),
  };
}

export function subtractDays(date: string, days: number): string {
  return dayjs(date).subtract(days, "day").format("YYYY-MM-DD");
}

export function todayDate(): string {
  return dayjs().format("YYYY-MM-DD");
}

export function currentMonth(): string {
  return dayjs().format("YYYY-MM");
}
