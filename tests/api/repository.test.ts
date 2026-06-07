import { describe, expect, it } from "vitest";

import { InMemoryCalendarRepository } from "@/lib/repository";

describe("InMemoryCalendarRepository", () => {
  it("creates multiple entries for the same date across different activities", async () => {
    const repo = new InMemoryCalendarRepository();
    const [firstActivity, secondActivity] = await repo.listActivities();

    const created = await repo.createEntry({
      entryDate: "2026-06-01",
      title: firstActivity.name,
      activityId: firstActivity.id,
    });
    await repo.createEntry({
      entryDate: "2026-06-01",
      title: secondActivity.name,
      activityId: secondActivity.id,
    });

    const found = await repo.listEntriesByDate("2026-06-01");

    expect(created.id).toBeDefined();
    expect(found).toHaveLength(2);
    expect(found.map((entry) => entry.activityId)).toEqual(expect.arrayContaining([firstActivity.id, secondActivity.id]));
  });

  it("updates and deletes entry", async () => {
    const repo = new InMemoryCalendarRepository();

    const created = await repo.createEntry({
      entryDate: "2026-06-02",
      title: "学习",
    });

    const updated = await repo.updateEntry(created.id, {
      title: "学习 TypeScript",
      note: "完成 2 章",
    });

    expect(updated.title).toBe("学习 TypeScript");

    await repo.deleteEntry(created.id);

    const found = await repo.listEntriesByDate("2026-06-02");
    expect(found).toHaveLength(0);
  });

  it("counts distinct marked days for activity in range", async () => {
    const repo = new InMemoryCalendarRepository();
    const [firstActivity] = await repo.listActivities();

    await repo.createEntry({
      entryDate: "2026-06-01",
      title: "运动 A",
      activityId: firstActivity.id,
    });
    await repo.createEntry({
      entryDate: "2026-06-02",
      title: "运动 B",
      activityId: firstActivity.id,
    });

    const count = await repo.countDistinctDaysByActivity(firstActivity.id, "2026-06-01");
    expect(count).toBe(2);
  });

  it("deletes an activity and removes linked entries", async () => {
    const repo = new InMemoryCalendarRepository();
    const [firstActivity] = await repo.listActivities();

    await repo.createEntry({
      entryDate: "2026-06-05",
      title: firstActivity.name,
      activityId: firstActivity.id,
    });

    await repo.deleteActivity(firstActivity.id);

    const activities = await repo.listActivities();
    const entries = await repo.listEntriesByDate("2026-06-05");

    expect(activities.find((activity) => activity.id === firstActivity.id)).toBeUndefined();
    expect(entries).toHaveLength(0);
  });

  it("summarizes trailing yearly monthly counts and last-30-day counts", async () => {
    const repo = new InMemoryCalendarRepository();
    const [firstActivity] = await repo.listActivities();

    await repo.createEntry({
      entryDate: "2026-06-01",
      title: firstActivity.name,
      activityId: firstActivity.id,
    });
    await repo.createEntry({
      entryDate: "2026-06-05",
      title: firstActivity.name,
      activityId: firstActivity.id,
    });
    await repo.createEntry({
      entryDate: "2026-05-03",
      title: firstActivity.name,
      activityId: firstActivity.id,
    });
    await repo.createEntry({
      entryDate: "2025-07-21",
      title: firstActivity.name,
      activityId: firstActivity.id,
    });

    const last30DaysCount = await repo.countEntriesByActivityInRange(
      firstActivity.id,
      "2026-05-08",
      "2026-06-06"
    );
    const monthlyCounts = await repo.getMonthlyEntryCountsByActivity(firstActivity.id, "2026-06", 12);

    expect(last30DaysCount).toBe(2);
    expect(monthlyCounts).toHaveLength(12);
    expect(monthlyCounts.find((item) => item.month === "2026-06")?.count).toBe(2);
    expect(monthlyCounts.find((item) => item.month === "2026-05")?.count).toBe(1);
    expect(monthlyCounts.find((item) => item.month === "2025-07")?.count).toBe(1);
  });
});
