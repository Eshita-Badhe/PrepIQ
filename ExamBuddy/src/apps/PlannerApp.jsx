// PlannerApp.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/app.css";

export default function PlannerApp() {
  const [preferences, setPreferences] = useState({ hoursPerDay: 2, focusAreas: [] });
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    axios.get("/api/planner/preferences").then((res) => {
      setPreferences(res.data.preferences);
      setPlan(res.data.plan);
    });
  }, []);

  const updatePref = (field, value) => {
    setPreferences((p) => ({ ...p, [field]: value }));
  };

  const generatePlan = async () => {
    const res = await axios.post("/api/planner/generate", { preferences });
    setPlan(res.data.plan);
  };

  const savePlan = async () => {
    await axios.post("/api/planner/save", { plan });
  };

  return (
    <div className="planner-app">
      <h2>Study Planner</h2>

      <section>
        <h3>Preferences</h3>
        <label>
          Hours per day
          <input
            type="number"
            min={1}
            max={12}
            value={preferences.hoursPerDay}
            onChange={(e) => updatePref("hoursPerDay", Number(e.target.value))}
          />
        </label>
        <label>
          Focus areas (comma-separated)
          <input
            type="text"
            value={preferences.focusAreas.join(", ")}
            onChange={(e) =>
              updatePref(
                "focusAreas",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </label>
        <button onClick={generatePlan}>Generate / Update plan</button>
        <button onClick={savePlan} disabled={!plan}>
          Save
        </button>
      </section>

      <section>
        <h3>Calendar view</h3>
        {!plan && <p>No plan yet.</p>}
        {plan && (
          <ul>
            {plan.days.map((day) => (
              <li key={day.date}>
                <strong>{day.date}</strong>: {day.tasks.join("; ")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
