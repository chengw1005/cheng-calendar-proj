"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  name: string;
  color: string;
  isPreset: boolean;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityNameInput, setActivityNameInput] = useState("");
  const [activityColorInput, setActivityColorInput] = useState("#22c55e");

  async function loadActivities() {
    const res = await fetch("/api/activities");
    const data = await res.json();
    if (res.ok) {
      setActivities(data);
    }
  }

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

  function startCreate() {
    setEditingActivityId(null);
    setActivityNameInput("");
    setActivityColorInput("#22c55e");
  }

  function startEdit(activity: Activity) {
    setEditingActivityId(activity.id);
    setActivityNameInput(activity.name);
    setActivityColorInput(activity.color);
  }

  async function saveActivity() {
    const trimmedName = activityNameInput.trim();
    if (!trimmedName) {
      return;
    }

    const res = await fetch("/api/activities", {
      method: editingActivityId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingActivityId ?? undefined,
        name: trimmedName,
        color: activityColorInput,
      }),
    });

    if (!res.ok) {
      return;
    }

    await loadActivities();
    startCreate();
  }

  async function deleteActivity(id: string) {
    const res = await fetch(`/api/activities?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      return;
    }

    await loadActivities();
    if (editingActivityId === id) {
      startCreate();
    }
  }

  return (
    <main className="card">
      <h2>活动管理</h2>
      <p>在这里新增、编辑或删除预定义活动。删除活动会同时删除该活动已有的日历标记。</p>

      <section className="card" style={{ borderStyle: "dashed", marginBottom: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>{editingActivityId ? "编辑活动" : "新增活动"}</h3>
        <div className="controls">
          <input
            value={activityNameInput}
            onChange={(e) => setActivityNameInput(e.target.value)}
            placeholder="活动名称"
          />
          <input
            type="color"
            value={activityColorInput}
            onChange={(e) => setActivityColorInput(e.target.value)}
            aria-label="活动颜色"
          />
          <button type="button" onClick={() => void saveActivity()}>
            {editingActivityId ? "保存活动" : "添加活动"}
          </button>
          <button type="button" className="secondary" onClick={startCreate}>
            重置
          </button>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>活动列表</h3>
        <div style={{ display: "grid", gap: "2px" }}>
          {activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.4rem 0.5rem",
                borderRadius: "6px",
                background: editingActivityId === activity.id ? "#f0f9ff" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: activity.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.9rem" }}>{activity.name}</span>
                {activity.isPreset ? (
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)", background: "var(--bg)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>预定义</span>
                ) : null}
              </div>
              {!activity.isPreset ? (
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    className="secondary"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                    onClick={() => startEdit(activity)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="danger"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                    onClick={() => void deleteActivity(activity.id)}
                  >
                    删除
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}