import { getCalendarRepository } from "@/lib/repository";
import { fail, ok } from "@/lib/api-response";
import { subtractDays, todayDate } from "@/lib/date";

export async function GET() {
  try {
    const toDate = todayDate();
    const fromDate = subtractDays(toDate, 364);

    const repo = await getCalendarRepository();
    const counts = await repo.getDailyEntryCounts(fromDate, toDate);

    return ok({ fromDate, toDate, counts });
  } catch (error) {
    return fail(error);
  }
}
