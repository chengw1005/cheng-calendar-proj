import { getCalendarRepository } from "@/lib/repository";
import { subtractDays, todayDate } from "@/lib/date";
import { NextResponse } from "next/server";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  try {
    const toDate = todayDate();
    const fromDate = subtractDays(toDate, 364);

    const repo = await getCalendarRepository();
    const rows = await repo.listEntriesWithActivity(fromDate, toDate);

    const header = "日期,活动,标题,备注";
    const lines = rows.map((r) =>
      [r.date, escapeCsv(r.activityName), escapeCsv(r.title), escapeCsv(r.note ?? "")].join(",")
    );

    const csv = "\uFEFF" + [header, ...lines].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="calendar-export-${fromDate}-to-${toDate}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : String(e) } },
      { status: 500 }
    );
  }
}
