import { getCalendarRepository } from "@/lib/repository";
import { fail, ok } from "@/lib/api-response";
import { statsQuerySchema } from "@/lib/validation";
import { subtractDays, todayDate } from "@/lib/date";
import dayjs from "dayjs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = statsQuerySchema.parse({
      activityId: url.searchParams.get("activityId"),
    });

    const toDate = todayDate();
    const last30DaysFrom = subtractDays(toDate, 29);
    const endingMonth = dayjs(toDate).format("YYYY-MM");

    const repo = await getCalendarRepository();
    const last30DaysCount = await repo.countEntriesByActivityInRange(parsed.activityId, last30DaysFrom, toDate);
    const monthlyCounts = await repo.getMonthlyEntryCountsByActivity(parsed.activityId, endingMonth, 12);

    return ok({
      activityId: parsed.activityId,
      last30Days: {
        fromDate: last30DaysFrom,
        toDate,
        count: last30DaysCount,
      },
      trailingYear: {
        fromMonth: monthlyCounts[0]?.month,
        toMonth: monthlyCounts[monthlyCounts.length - 1]?.month,
        monthlyCounts,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
