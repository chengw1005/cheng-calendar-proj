"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  name: string;
};

type StatsResponse = {
  last30Days: {
    fromDate: string;
    toDate: string;
    count: number;
  };
  trailingYear: {
    fromMonth?: string;
    toMonth?: string;
    monthlyCounts: Array<{
      month: string;
      count: number;
    }>;
  };
};

export default function StatsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityId, setActivityId] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (res.ok && !cancelled) {
        setActivities(data);
        if (data.length > 0) {
          setActivityId(data[0].id);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activityId) {
      return;
    }

    let cancelled = false;

    async function run() {
      const res = await fetch(`/api/stats?activityId=${activityId}`);
      const data = await res.json();
      if (res.ok && !cancelled) {
        setStats(data);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [activityId]);

  const maxCount = Math.max(...(stats?.trailingYear.monthlyCounts.map((item) => item.count) ?? [1]), 1);

  return (
    <main className="card">
      <h2>统计</h2>
      <div className="controls">
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)}>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {stats ? (
        <>
          <div className="card" style={{ marginTop: "1rem" }}>
            <p>最近 30 天次数: {stats.last30Days.count}</p>
            <p>
              时间范围: {stats.last30Days.fromDate} ~ {stats.last30Days.toDate}
            </p>
          </div>

          <div className="card" style={{ marginTop: "1rem" }}>
            <p style={{ marginTop: 0 }}>
              过去一年: {stats.trailingYear.fromMonth} ~ {stats.trailingYear.toMonth}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                alignItems: "end",
                gap: "0.5rem",
                minHeight: "220px",
              }}
            >
              {stats.trailingYear.monthlyCounts.map((item) => (
                <div
                  key={item.month}
                  style={{ display: "flex", flexDirection: "column", justifyContent: "end", alignItems: "center", gap: "0.4rem" }}
                >
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{item.count}</div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "32px",
                      height: `${Math.max((item.count / maxCount) * 160, item.count > 0 ? 12 : 2)}px`,
                      background: "linear-gradient(180deg, #0f766e 0%, #14b8a6 100%)",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.month.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
