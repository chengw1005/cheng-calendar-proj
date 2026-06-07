"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

type Activity = {
  id: string;
  name: string;
  color: string;
};

type Entry = {
  id: string;
  entryDate: string;
  title: string;
  note?: string;
  activityId?: string;
};

export default function CalendarPage() {
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const today = dayjs().format("YYYY-MM-DD");
  const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    const updateMobileState = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);

    return () => {
      mediaQuery.removeEventListener("change", updateMobileState);
    };
  }, []);

  const visibleMonths = useMemo(() => {
    const center = dayjs(`${month}-01`);
    const offsets = isMobile ? [0] : [-1, 0, 1];
    return offsets.map((offset) => center.add(offset, "month"));
  }, [month, isMobile]);

  const monthSections = useMemo(
    () =>
      visibleMonths.map((monthDate) => {
        const total = monthDate.daysInMonth();
        const firstWeekday = monthDate.day();
        return {
          key: monthDate.format("YYYY-MM"),
          label: monthDate.format("YYYY 年 M 月"),
          cells: [
            ...Array.from({ length: firstWeekday }, () => null),
            ...Array.from({ length: total }, (_, i) => monthDate.date(i + 1).format("YYYY-MM-DD")),
          ],
        };
      }),
    [visibleMonths]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const responses = await Promise.all(
        visibleMonths.map((monthDate) => fetch(`/api/entries?month=${monthDate.format("YYYY-MM")}`))
      );
      const payloads = await Promise.all(responses.map((res) => res.json()));
      if (!cancelled && responses.every((res) => res.ok)) {
        setEntries(payloads.flat());
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [visibleMonths]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (res.ok && !cancelled) {
        setActivities(data);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadEntries(selectedMonth: string) {
    const center = dayjs(`${selectedMonth}-01`);
    const offsets = isMobile ? [0] : [-1, 0, 1];
    const months = offsets.map((offset) => center.add(offset, "month").format("YYYY-MM"));
    const responses = await Promise.all(months.map((value) => fetch(`/api/entries?month=${value}`)));
    const payloads = await Promise.all(responses.map((res) => res.json()));
    if (responses.every((res) => res.ok)) {
      setEntries(payloads.flat());
    }
  }

  function openDateModal(date: string) {
    setSelectedDate(date);
    setIsDateModalOpen(true);
  }

  async function addEntry(date: string, activityId: string) {
    if (!activityId) {
      return;
    }

    const selectedActivity = activities.find((a) => a.id === activityId);
    if (!selectedActivity) {
      return;
    }

    const payload = {
      entryDate: date,
      title: selectedActivity.name,
      activityId,
    };

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await loadEntries(month);
      setIsDateModalOpen(false);
    }
  }

  async function removeEntry(entryId: string) {
    if (!entryId) {
      return;
    }

    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    if (res.ok) {
      await loadEntries(month);
      setIsDateModalOpen(false);
    }
  }

  const entryByDate = new Map(entries.map((e) => [e.entryDate, e]));
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const selectedEntries = selectedDate ? entries.filter((entry) => entry.entryDate === selectedDate) : [];
  const selectedEntryByActivityId = new Map(
    selectedEntries.filter((entry) => entry.activityId).map((entry) => [entry.activityId as string, entry])
  );

  return (
    <main className="card">
      <div className="controls calendarNav" style={{ marginBottom: "0.75rem", justifyContent: "space-between" }}>
        <button type="button" className="secondary" onClick={() => setMonth(dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM"))}>
          &lt;
        </button>
        <div style={{ fontWeight: 600 }}>{dayjs(`${month}-01`).format("YYYY 年 M 月")}</div>
        <button type="button" className="secondary" onClick={() => setMonth(dayjs(`${month}-01`).add(1, "month").format("YYYY-MM"))}>
          &gt;
        </button>
      </div>

      <div className="monthDeck" style={{ marginBottom: "1rem" }}>
        {monthSections.map((section) => (
          <section key={section.key} className="card" style={{ padding: "0.75rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem" }}>{section.label}</h3>
            <div className="grid">
              {weekdayLabels.map((label) => (
                <div key={label} style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center" }}>
                  {label}
                </div>
              ))}
              {section.cells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${section.key}-${index}`} aria-hidden="true" />;
                }

                const dayEntries = entries.filter((entry) => entry.entryDate === date);
                const isToday = date === today;

                return (
                  <button
                    key={date}
                    className="dayCell"
                    onClick={() => openDateModal(date)}
                    style={{
                      textAlign: "left",
                      color: "inherit",
                      background: isToday ? "#dff7f0" : "white",
                      borderColor: isToday ? "var(--accent)" : "var(--line)",
                    }}
                  >
                    <div style={{ fontWeight: isToday ? 700 : 500 }}>{dayjs(date).format("D")}</div>
                    <div className="controls" style={{ marginTop: "0.35rem", gap: "0.25rem" }}>
                      {dayEntries.slice(0, 3).map((entry) => {
                        const activity = entry.activityId ? activityById.get(entry.activityId) : undefined;
                        return activity ? (
                          <div key={entry.id} className="dot" style={{ background: activity.color }} />
                        ) : null;
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {isDateModalOpen ? (
        <div
          className="dateModalOverlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "grid",
            padding: "1rem",
            zIndex: 30,
          }}
          onClick={() => setIsDateModalOpen(false)}
        >
          <div
            className="card dateModalSheet"
            style={{ width: "100%", maxWidth: "520px", alignSelf: isMobile ? "end" : "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>日期: {selectedDate}</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {activities.map((activity) => {
                const currentEntry = selectedEntryByActivityId.get(activity.id);
                const isMarked = Boolean(currentEntry);
                const action = isMarked && currentEntry
                  ? () => void removeEntry(currentEntry.id)
                  : () => void addEntry(selectedDate, activity.id);

                return (
                  <div
                    key={activity.id}
                    className="card"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className="dot" style={{ background: activity.color, marginTop: 0 }} />
                      <div>{activity.name}</div>
                    </div>
                    <button
                      type="button"
                      className={isMarked ? "danger" : undefined}
                      onClick={action}
                    >
                      {isMarked ? "删除标记" : "添加标记"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
