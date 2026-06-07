"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n-context";

type Activity = {
  id: string;
  name: string;
  color: string;
  isPreset: boolean;
};

export default function ActivitiesPage() {
  const { t, tActivity } = useI18n();
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
      <h2>{t("act.title")}</h2>
      <p>{t("act.desc")}</p>

      <section className="card" style={{ borderStyle: "dashed", marginBottom: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>{editingActivityId ? t("act.editTitle") : t("act.addTitle")}</h3>
        <div className="controls">
          <input
            value={activityNameInput}
            onChange={(e) => setActivityNameInput(e.target.value)}
            placeholder={t("act.namePlaceholder")}
          />
          <input
            type="color"
            value={activityColorInput}
            onChange={(e) => setActivityColorInput(e.target.value)}
            aria-label={t("act.colorLabel")}
          />
          <button type="button" onClick={() => void saveActivity()}>
            {editingActivityId ? t("act.save") : t("act.add")}
          </button>
          <button type="button" className="secondary" onClick={startCreate}>
            {t("act.reset")}
          </button>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>{t("act.list")}</h3>
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
                <span style={{ fontSize: "0.9rem" }}>{tActivity(activity.name)}</span>
                {activity.isPreset ? (
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)", background: "var(--bg)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{t("act.preset")}</span>
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
                    {t("act.edit")}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                    onClick={() => void deleteActivity(activity.id)}
                  >
                    {t("act.delete")}
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