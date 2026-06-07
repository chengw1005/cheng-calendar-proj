import { describe, expect, it } from "vitest";

import { createEntrySchema, statsQuerySchema } from "@/lib/validation";

describe("validation schemas", () => {
  it("validates entry payload", () => {
    const parsed = createEntrySchema.parse({
      entryDate: "2026-06-01",
      title: "阅读",
      note: "30 分钟",
    });

    expect(parsed.title).toBe("阅读");
  });

  it("validates stats query with activity id", () => {
    const parsed = statsQuerySchema.parse({
      activityId: "4f5abec7-1eb3-4eb6-86a1-4fd6a22a6fb8",
    });

    expect(parsed.activityId).toBe("4f5abec7-1eb3-4eb6-86a1-4fd6a22a6fb8");
  });
});
