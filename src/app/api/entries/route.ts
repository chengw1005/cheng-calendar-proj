import { getCalendarRepository } from "@/lib/repository";
import { createEntrySchema, monthQuerySchema } from "@/lib/validation";
import { fail, ok } from "@/lib/api-response";
import { currentMonth } from "@/lib/date";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month") ?? currentMonth();
    const query = monthQuerySchema.parse({ month });

    const repo = await getCalendarRepository();
    const entries = await repo.listEntriesByMonth(query.month);
    return ok(entries);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createEntrySchema.parse(body);

    const repo = await getCalendarRepository();
    const created = await repo.createEntry(input);
    return ok(created, 201);
  } catch (error) {
    return fail(error);
  }
}
