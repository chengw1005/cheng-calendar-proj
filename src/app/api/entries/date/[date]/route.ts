import { getCalendarRepository } from "@/lib/repository";
import { dateParamSchema } from "@/lib/validation";
import { fail, ok } from "@/lib/api-response";

type Params = {
  params: Promise<{ date: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const parsed = dateParamSchema.parse(await params);

    const repo = getCalendarRepository();
    const entries = await repo.listEntriesByDate(parsed.date);

    return ok(entries);
  } catch (error) {
    return fail(error);
  }
}
