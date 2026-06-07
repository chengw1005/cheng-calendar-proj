import { getCalendarRepository } from "@/lib/repository";
import { createActivitySchema, updateActivitySchema } from "@/lib/validation";
import { fail, ok } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";

export async function GET() {
  try {
    const repo = await getCalendarRepository();
    const activities = await repo.listActivities();
    return ok(activities);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createActivitySchema.parse(body);

    const repo = await getCalendarRepository();
    const created = await repo.createActivity(input);
    return ok(created, 201);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    const input = updateActivitySchema.parse({
      name: body?.name,
      color: body?.color,
    });

    if (!id) {
      throw new ApiError("VALIDATION_ERROR", "id is required", 400);
    }

    const repo = await getCalendarRepository();
    const updated = await repo.updateActivity(id, input);
    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      throw new ApiError("VALIDATION_ERROR", "id is required", 400);
    }

    const repo = await getCalendarRepository();
    await repo.deleteActivity(id);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
