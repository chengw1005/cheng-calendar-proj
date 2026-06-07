"use client";

import { useState } from "react";

type Entry = {
  id: string;
  entryDate: string;
  title: string;
  note?: string;
  activityId?: string;
};

export default function SearchPage() {
  const [date, setDate] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");

  async function searchByDate() {
    if (!date) {
      return;
    }

    setError("");
    setEntries([]);

    const res = await fetch(`/api/entries/date/${date}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error?.message ?? "未找到记录");
      return;
    }

    setEntries(data);
  }

  return (
    <main className="card">
      <h2>日期搜索</h2>
      <div className="controls">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={searchByDate}>搜索</button>
      </div>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {!error && date && entries.length === 0 ? <p>该日期没有标记。</p> : null}
      {entries.length > 0 ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>共 {entries.length} 条标记</h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {entries.map((entry) => (
              <div key={entry.id} className="card">
                <h4 style={{ marginTop: 0, marginBottom: "0.5rem" }}>{entry.title}</h4>
                <p>日期: {entry.entryDate}</p>
                <p>备注: {entry.note || "(无)"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
