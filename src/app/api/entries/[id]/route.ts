import { getCalendarRepository } from "@/lib/repository";
import { updateEntrySchema } from "@/lib/validation";
import { fail, ok } from "@/lib/api-response";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const input = updateEntrySchema.parse(body);
    const { id } = await params;

    const repo = await getCalendarRepository();
    const updated = await repo.updateEntry(id, input);
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const repo = await getCalendarRepository();
    await repo.deleteEntry(id);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
