"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n-context";

type Activity = {
  id: string;
  name: string;
  color: string;
};

type Entry = {
  id: string;
  entryDate: string;
  title: string;
  activityId?: string;
};

export default function SearchPage() {
  const { t, tActivity } = useI18n();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (res.ok && !cancelled) setActivities(data);
    }
    void run();
    return () => { cancelled = true; };
  }, []);

  async function handleSearch() {
    if (!fromDate || !toDate) return;
    setSearched(false);

    const start = dayjs(fromDate);
    const end = dayjs(toDate);
    const months: string[] = [];
    let cur = start.startOf("month");
    while (cur.isBefore(end.endOf("month"))) {
      months.push(cur.format("YYYY-MM"));
      cur = cur.add(1, "month");
    }

    const responses = await Promise.all(months.map((m) => fetch(`/api/entries?month=${m}`)));
    const payloads = await Promise.all(responses.map((r) => r.json()));

    let all: Entry[] = payloads.flat();
    all = all.filter((e) => e.entryDate >= fromDate && e.entryDate <= toDate);
    if (activityFilter) {
      all = all.filter((e) => e.activityId === activityFilter);
    }

    setEntries(all);
    setSearched(true);
  }

  const grouped = useMemo(() => {
    const actMap = new Map(activities.map((a) => [a.id, a]));
    const groups = new Map<string, { activity: Activity | null; entries: Entry[] }>();

    for (const entry of entries) {
      const act = entry.activityId ? actMap.get(entry.activityId) ?? null : null;
      const key = act?.id ?? "__none__";
      if (!groups.has(key)) {
        groups.set(key, { activity: act, entries: [] });
      }
      groups.get(key)!.entries.push(entry);
    }

    for (const group of groups.values()) {
      group.entries.sort((a, b) => a.entryDate.localeCompare(b.entryDate));
    }

    return Array.from(groups.values());
  }, [entries, activities]);

  return (
    <main className="card">
      <h2>{t("search.title")}</h2>
      <div className="controls" style={{ flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
          {t("search.from")}
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
          {t("search.to")}
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
          <option value="">{t("search.all")}</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{tActivity(a.name)}</option>
          ))}
        </select>
        <button type="button" onClick={() => void handleSearch()}>{t("search.search")}</button>
      </div>

      {searched && entries.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: "1rem" }}>{t("search.noResults")}</p>
      ) : null}

      {grouped.length > 0 ? (
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          {grouped.map((group) => (
            <div key={group.activity?.id ?? "none"} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {group.activity ? (
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: group.activity.color, flexShrink: 0 }} />
                ) : null}
                <strong style={{ fontSize: "0.95rem" }}>{group.activity ? tActivity(group.activity.name) : "—"}</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {group.entries.length} {t("search.entries")}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                {group.entries.map((entry) => (
                  <span
                    key={entry.id}
                    style={{
                      fontSize: "0.8rem",
                      background: "var(--bg)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      color: "var(--muted)",
                    }}
                  >
                    {entry.entryDate}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
