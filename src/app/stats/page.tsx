"use client";

import { useEffect, useMemo, useState } from "react";

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

type HeatmapResponse = {
  fromDate: string;
  toDate: string;
  counts: Array<{ date: string; count: number }>;
};

/* ─── Heatmap helpers ─── */

function buildHeatmapGrid(fromDate: string, toDate: string, counts: Array<{ date: string; count: number }>) {
  const countMap = new Map(counts.map((c) => [c.date, c.count]));
  const start = new Date(fromDate + "T00:00:00");
  const end = new Date(toDate + "T00:00:00");

  const startDow = start.getDay();
  const days: Array<{ date: string; count: number }> = [];

  for (let i = 0; i < startDow; i++) {
    days.push({ date: "", count: -1 });
  }

  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    days.push({ date: d, count: countMap.get(d) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }

  const weeks: Array<typeof days> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  while (weeks.length > 0 && weeks[weeks.length - 1].length < 7) {
    weeks[weeks.length - 1].push({ date: "", count: -1 });
  }

  return weeks;
}

function heatColor(count: number, max: number): string {
  if (count <= 0) return "#ebedf0";
  const ratio = count / Math.max(max, 1);
  if (ratio <= 0.25) return "#9be9a8";
  if (ratio <= 0.5) return "#40c463";
  if (ratio <= 0.75) return "#30a14e";
  return "#216e39";
}

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export default function StatsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityId, setActivityId] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const [actRes, hmRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/stats/heatmap"),
      ]);
      const actData = await actRes.json();
      if (actRes.ok && !cancelled) {
        setActivities(actData);
        if (actData.length > 0) setActivityId(actData[0].id);
      }
      if (hmRes.ok && !cancelled) {
        setHeatmap(await hmRes.json());
      }
    }

    void run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activityId) return;

    let cancelled = false;

    async function run() {
      const res = await fetch(`/api/stats?activityId=${activityId}`);
      const data = await res.json();
      if (res.ok && !cancelled) setStats(data);
    }

    void run();
    return () => { cancelled = true; };
  }, [activityId]);

  const weeks = useMemo(() => {
    if (!heatmap) return [];
    return buildHeatmapGrid(heatmap.fromDate, heatmap.toDate, heatmap.counts);
  }, [heatmap]);

  const heatMax = useMemo(() => {
    if (!heatmap) return 1;
    return Math.max(...heatmap.counts.map((c) => c.count), 1);
  }, [heatmap]);

  const monthMarkers = useMemo(() => {
    if (weeks.length === 0) return [];
    const markers: Array<{ label: string; col: number }> = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      const firstReal = weeks[w].find((d) => d.count >= 0);
      if (!firstReal || !firstReal.date) continue;
      const m = new Date(firstReal.date + "T00:00:00").getMonth();
      if (m !== lastMonth) {
        markers.push({ label: MONTH_LABELS[m], col: w });
        lastMonth = m;
      }
    }
    return markers;
  }, [weeks]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) {
        alert("导出失败");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calendar-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const maxCount = Math.max(...(stats?.trailingYear.monthlyCounts.map((item) => item.count) ?? [1]), 1);
  const totalEntries = heatmap?.counts.reduce((s, c) => s + c.count, 0) ?? 0;
  const activeDays = heatmap?.counts.length ?? 0;

  return (
    <main className="card">
      <h2>统计</h2>

      {/* ─── GitHub-style heatmap ─── */}
      {heatmap ? (
        <div className="card" style={{ marginTop: "1rem", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <p style={{ margin: 0 }}>
              过去一年共 <strong>{totalEntries}</strong> 条记录，覆盖 <strong>{activeDays}</strong> 天
            </p>
            <button
              type="button"
              className="secondary"
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              {exporting ? "导出中..." : "导出 CSV"}
            </button>
          </div>

          {/* month labels */}
          <div style={{ display: "flex", paddingLeft: "28px" }}>
            {(() => {
              const cells: React.ReactNode[] = [];
              let mi = 0;
              for (let w = 0; w < weeks.length; w++) {
                if (mi < monthMarkers.length && monthMarkers[mi].col === w) {
                  cells.push(
                    <span key={w} style={{ fontSize: "0.7rem", color: "var(--muted)", width: "14px", textAlign: "left", flexShrink: 0 }}>
                      {monthMarkers[mi].label}
                    </span>
                  );
                  mi++;
                } else {
                  cells.push(<span key={w} style={{ width: "14px", flexShrink: 0 }} />);
                }
              }
              return cells;
            })()}
          </div>

          {/* heatmap grid */}
          <div style={{ display: "flex", gap: "2px" }}>
            {/* day-of-week labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingTop: "2px" }}>
              {DAY_LABELS.map((label, i) => (
                <div key={i} style={{ width: "24px", height: "12px", fontSize: "0.6rem", color: "var(--muted)", display: "flex", alignItems: "center" }}>
                  {i % 2 === 1 ? label : ""}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date ? `${day.date}: ${day.count} 条` : ""}
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "2px",
                      background: day.count < 0 ? "transparent" : heatColor(day.count, heatMax),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "0.5rem", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>少</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: heatColor(level === 0 ? 0 : level * (heatMax / 4), heatMax),
                }}
              />
            ))}
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>多</span>
          </div>
        </div>
      ) : null}

      {/* ─── Per-activity stats ─── */}
      <div className="controls" style={{ marginTop: "1rem" }}>
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
