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
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="dot" style={{ background: activity.color, marginTop: 0 }} />
                <div>
                  <div>{activity.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {activity.isPreset ? "预定义活动" : "自定义活动"}
                  </div>
                </div>
              </div>
              <div className="controls">
                <button type="button" className="secondary" onClick={() => startEdit(activity)}>
                  编辑
                </button>
                <button type="button" className="danger" onClick={() => void deleteActivity(activity.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}