import { type SupabaseClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

import { ApiError } from "@/lib/errors";
import { makeId } from "@/lib/id";
import { hasSupabaseEnv } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  Activity,
  CalendarEntry,
  CreateActivityInput,
  CreateEntryInput,
  UpdateActivityInput,
  UpdateEntryInput,
} from "@/types/domain";

export interface CalendarRepository {
  listActivities(): Promise<Activity[]>;
  createActivity(input: CreateActivityInput): Promise<Activity>;
  updateActivity(id: string, input: UpdateActivityInput): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  listEntriesByMonth(month: string): Promise<CalendarEntry[]>;
  listEntriesByDate(date: string): Promise<CalendarEntry[]>;
  createEntry(input: CreateEntryInput): Promise<CalendarEntry>;
  updateEntry(id: string, input: UpdateEntryInput): Promise<CalendarEntry>;
  deleteEntry(id: string): Promise<void>;
  countDistinctDaysByActivity(activityId: string, fromDate: string): Promise<number>;
  countEntriesByActivityInRange(activityId: string, fromDate: string, toDate: string): Promise<number>;
  getMonthlyEntryCountsByActivity(activityId: string, endingMonth: string, monthCount: number): Promise<Array<{ month: string; count: number }>>;
  getDailyEntryCounts(fromDate: string, toDate: string): Promise<Array<{ date: string; count: number }>>;
  listEntriesWithActivity(fromDate: string, toDate: string): Promise<Array<{ date: string; title: string; activityName: string; note?: string }>>;
}

type Store = {
  activities: Activity[];
  entries: CalendarEntry[];
};

type ActivityRow = {
  id: string;
  name: string;
  color: string;
  is_preset: boolean;
  created_at: string;
};

type EntryRow = {
  id: string;
  entry_date: string;
  title: string;
  note: string | null;
  activity_id: string | null;
  created_at: string;
  updated_at: string;
};

export const presetActivities: Omit<Activity, "id" | "createdAt">[] = [
  { name: "运动", color: "#22c55e", isPreset: true },
  { name: "学习", color: "#3b82f6", isPreset: true },
  { name: "阅读", color: "#f59e0b", isPreset: true },
  { name: "旅行", color: "#ef4444", isPreset: true },
];

export class InMemoryCalendarRepository implements CalendarRepository {
  private store: Store;

  constructor(seed?: Partial<Store>) {
    this.store = {
      activities:
        seed?.activities ??
        presetActivities.map((a) => ({
          ...a,
          id: makeId(),
          createdAt: new Date().toISOString(),
        })),
      entries: seed?.entries ?? [],
    };
  }

  async listActivities(): Promise<Activity[]> {
    return [...this.store.activities];
  }

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    const activity: Activity = {
      id: makeId(),
      name: input.name,
      color: input.color,
      isPreset: input.isPreset ?? false,
      createdAt: new Date().toISOString(),
    };
    this.store.activities.push(activity);
    return activity;
  }

  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    const idx = this.store.activities.findIndex((activity) => activity.id === id);
    if (idx < 0) {
      throw new ApiError("NOT_FOUND", "Activity not found", 404);
    }

    const existing = this.store.activities[idx];
    const updated: Activity = {
      ...existing,
      ...input,
    };
    this.store.activities[idx] = updated;

    const renamed = input.name;
    if (renamed) {
      this.store.entries = this.store.entries.map((entry) =>
        entry.activityId === id ? { ...entry, title: renamed, updatedAt: new Date().toISOString() } : entry
      );
    }

    return updated;
  }

  async deleteActivity(id: string): Promise<void> {
    const idx = this.store.activities.findIndex((activity) => activity.id === id);
    if (idx < 0) {
      throw new ApiError("NOT_FOUND", "Activity not found", 404);
    }

    this.store.activities.splice(idx, 1);
    this.store.entries = this.store.entries.filter((entry) => entry.activityId !== id);
  }

  async listEntriesByMonth(month: string): Promise<CalendarEntry[]> {
    return this.store.entries.filter((entry) => entry.entryDate.startsWith(month));
  }

  async listEntriesByDate(date: string): Promise<CalendarEntry[]> {
    return this.store.entries.filter((entry) => entry.entryDate === date);
  }

  async createEntry(input: CreateEntryInput): Promise<CalendarEntry> {
    const existing = this.store.entries.find(
      (entry) => entry.entryDate === input.entryDate && entry.activityId === input.activityId
    );
    if (existing) {
      throw new ApiError("VALIDATION_ERROR", "Entry already exists for this activity on this day", 400);
    }

    const now = new Date().toISOString();
    const entry: CalendarEntry = {
      id: makeId(),
      entryDate: input.entryDate,
      title: input.title,
      note: input.note,
      activityId: input.activityId,
      createdAt: now,
      updatedAt: now,
    };

    this.store.entries.push(entry);
    return entry;
  }

  async updateEntry(id: string, input: UpdateEntryInput): Promise<CalendarEntry> {
    const idx = this.store.entries.findIndex((entry) => entry.id === id);
    if (idx < 0) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    const existing = this.store.entries[idx];
    const updated: CalendarEntry = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.store.entries[idx] = updated;
    return updated;
  }

  async deleteEntry(id: string): Promise<void> {
    const idx = this.store.entries.findIndex((entry) => entry.id === id);
    if (idx < 0) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }
    this.store.entries.splice(idx, 1);
  }

  async countDistinctDaysByActivity(activityId: string, fromDate: string): Promise<number> {
    const days = new Set(
      this.store.entries
        .filter((entry) => entry.activityId === activityId)
        .filter((entry) => dayjs(entry.entryDate).isAfter(dayjs(fromDate).subtract(1, "day")))
        .map((entry) => entry.entryDate)
    );
    return days.size;
  }

  async countEntriesByActivityInRange(activityId: string, fromDate: string, toDate: string): Promise<number> {
    return this.store.entries.filter((entry) => {
      if (entry.activityId !== activityId) {
        return false;
      }

      const value = dayjs(entry.entryDate);
      return value.isAfter(dayjs(fromDate).subtract(1, "day")) && value.isBefore(dayjs(toDate).add(1, "day"));
    }).length;
  }

  async getMonthlyEntryCountsByActivity(
    activityId: string,
    endingMonth: string,
    monthCount: number
  ): Promise<Array<{ month: string; count: number }>> {
    const end = dayjs(`${endingMonth}-01`);

    return Array.from({ length: monthCount }, (_, index) => {
      const month = end.subtract(monthCount - index - 1, "month").format("YYYY-MM");
      const count = this.store.entries.filter(
        (entry) => entry.activityId === activityId && entry.entryDate.startsWith(month)
      ).length;

      return { month, count };
    });
  }

  async getDailyEntryCounts(fromDate: string, toDate: string): Promise<Array<{ date: string; count: number }>> {
    const counts = new Map<string, number>();
    for (const entry of this.store.entries) {
      const d = entry.entryDate;
      if (d >= fromDate && d <= toDate) {
        counts.set(d, (counts.get(d) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries(), ([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async listEntriesWithActivity(fromDate: string, toDate: string): Promise<Array<{ date: string; title: string; activityName: string; note?: string }>> {
    const actMap = new Map(this.store.activities.map((a) => [a.id, a.name]));
    return this.store.entries
      .filter((e) => e.entryDate >= fromDate && e.entryDate <= toDate)
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate))
      .map((e) => ({
        date: e.entryDate,
        title: e.title,
        activityName: actMap.get(e.activityId ?? "") ?? "",
        note: e.note,
      }));
  }
}

function mapActivityRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isPreset: row.is_preset,
    createdAt: row.created_at,
  };
}

function mapEntryRow(row: EntryRow): CalendarEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    title: row.title,
    note: row.note ?? undefined,
    activityId: row.activity_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseCalendarRepository implements CalendarRepository {
  private supabase: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.supabase = client;
  }

  async listActivities(): Promise<Activity[]> {
    const { data, error } = await this.supabase.from("activities").select("*").order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapActivityRow(row as ActivityRow));
  }

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    const payload = {
      name: input.name,
      color: input.color,
      is_preset: input.isPreset ?? false,
    };

    const { data, error } = await this.supabase.from("activities").insert(payload).select("*").single();

    if (error) {
      throw error;
    }

    return mapActivityRow(data as ActivityRow);
  }

  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    const { data: existingActivity, error: fetchError } = await this.supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new ApiError("NOT_FOUND", "Activity not found", 404);
    }

    const { data, error } = await this.supabase
      .from("activities")
      .update({
        name: input.name ?? (existingActivity as ActivityRow).name,
        color: input.color ?? (existingActivity as ActivityRow).color,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (input.name) {
      const { error: entryUpdateError } = await this.supabase
        .from("calendar_entries")
        .update({ title: input.name, updated_at: new Date().toISOString() })
        .eq("activity_id", id);

      if (entryUpdateError) {
        throw entryUpdateError;
      }
    }

    return mapActivityRow(data as ActivityRow);
  }

  async deleteActivity(id: string): Promise<void> {
    const { error: entryDeleteError } = await this.supabase.from("calendar_entries").delete().eq("activity_id", id);
    if (entryDeleteError) {
      throw entryDeleteError;
    }

    const { error } = await this.supabase.from("activities").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async listEntriesByMonth(month: string): Promise<CalendarEntry[]> {
    const start = `${month}-01`;
    const end = dayjs(start).endOf("month").format("YYYY-MM-DD");

    const { data, error } = await this.supabase
      .from("calendar_entries")
      .select("*")
      .gte("entry_date", start)
      .lte("entry_date", end)
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapEntryRow(row as EntryRow));
  }

  async listEntriesByDate(date: string): Promise<CalendarEntry[]> {
    const { data, error } = await this.supabase
      .from("calendar_entries")
      .select("*")
      .eq("entry_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapEntryRow(row as EntryRow));
  }

  async createEntry(input: CreateEntryInput): Promise<CalendarEntry> {
    let existingQuery = this.supabase.from("calendar_entries").select("id").eq("entry_date", input.entryDate);

    if (input.activityId) {
      existingQuery = existingQuery.eq("activity_id", input.activityId);
    } else {
      existingQuery = existingQuery.is("activity_id", null);
    }

    const { data: existing, error: existingError } = await existingQuery;

    if (existingError) {
      throw existingError;
    }

    if ((existing ?? []).length > 0) {
      throw new ApiError("VALIDATION_ERROR", "Entry already exists for this activity on this day", 400);
    }

    const payload = {
      entry_date: input.entryDate,
      title: input.title,
      note: input.note ?? null,
      activity_id: input.activityId ?? null,
    };

    const { data, error } = await this.supabase.from("calendar_entries").insert(payload).select("*").single();

    if (error) {
      throw error;
    }

    return mapEntryRow(data as EntryRow);
  }

  async updateEntry(id: string, input: UpdateEntryInput): Promise<CalendarEntry> {
    const { data, error } = await this.supabase
      .from("calendar_entries")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.activityId !== undefined ? { activity_id: input.activityId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if ((error as { code?: string }).code === "PGRST116") {
        throw new ApiError("NOT_FOUND", "Entry not found", 404);
      }

      throw error;
    }

    return mapEntryRow(data as EntryRow);
  }

  async deleteEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("calendar_entries").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  async countDistinctDaysByActivity(activityId: string, fromDate: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("calendar_entries")
      .select("entry_date")
      .eq("activity_id", activityId)
      .gte("entry_date", fromDate);

    if (error) {
      throw error;
    }

    return new Set((data ?? []).map((row) => (row as { entry_date: string }).entry_date)).size;
  }

  async countEntriesByActivityInRange(activityId: string, fromDate: string, toDate: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("calendar_entries")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", activityId)
      .gte("entry_date", fromDate)
      .lte("entry_date", toDate);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async getMonthlyEntryCountsByActivity(
    activityId: string,
    endingMonth: string,
    monthCount: number
  ): Promise<Array<{ month: string; count: number }>> {
    const end = dayjs(`${endingMonth}-01`);
    const start = end.subtract(monthCount - 1, "month").startOf("month").format("YYYY-MM-DD");
    const finish = end.endOf("month").format("YYYY-MM-DD");

    const { data, error } = await this.supabase
      .from("calendar_entries")
      .select("entry_date")
      .eq("activity_id", activityId)
      .gte("entry_date", start)
      .lte("entry_date", finish)
      .order("entry_date", { ascending: true });

    if (error) {
      throw error;
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const month = (row as { entry_date: string }).entry_date.slice(0, 7);
      counts.set(month, (counts.get(month) ?? 0) + 1);
    }

    return Array.from({ length: monthCount }, (_, index) => {
      const month = end.subtract(monthCount - index - 1, "month").format("YYYY-MM");
      return { month, count: counts.get(month) ?? 0 };
    });
  }

  async getDailyEntryCounts(fromDate: string, toDate: string): Promise<Array<{ date: string; count: number }>> {
    const { data, error } = await this.supabase
      .from("calendar_entries")
      .select("entry_date")
      .gte("entry_date", fromDate)
      .lte("entry_date", toDate)
      .order("entry_date", { ascending: true });

    if (error) {
      throw error;
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const d = (row as { entry_date: string }).entry_date;
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return Array.from(counts.entries(), ([date, count]) => ({ date, count }));
  }

  async listEntriesWithActivity(fromDate: string, toDate: string): Promise<Array<{ date: string; title: string; activityName: string; note?: string }>> {
    const { data, error } = await this.supabase
      .from("calendar_entries")
      .select("entry_date, title, note, activities(name)")
      .gte("entry_date", fromDate)
      .lte("entry_date", toDate)
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => {
      const r = row as unknown as { entry_date: string; title: string; note: string | null; activities: { name: string } | null };
      return {
        date: r.entry_date,
        title: r.title,
        activityName: r.activities?.name ?? "",
        note: r.note ?? undefined,
      };
    });
  }
}

const globalForRepo = globalThis as typeof globalThis & {
  calendarRepo?: CalendarRepository;
};

export async function getCalendarRepository(): Promise<CalendarRepository> {
  if (hasSupabaseEnv()) {
    const supabase = await getSupabaseServerClient();
    return new SupabaseCalendarRepository(supabase);
  }
  if (!globalForRepo.calendarRepo) {
    globalForRepo.calendarRepo = new InMemoryCalendarRepository();
  }
  return globalForRepo.calendarRepo;
}

export async function initPresetActivities(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.from("activities").select("id").limit(1);
  if (data && data.length > 0) {
    return;
  }
  const rows = presetActivities.map((a) => ({
    name: a.name,
    color: a.color,
    is_preset: a.isPreset,
  }));
  await supabase.from("activities").insert(rows);
}
