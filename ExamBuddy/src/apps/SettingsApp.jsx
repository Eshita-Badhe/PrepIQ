// SettingsApp.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/app.css";

export default function SettingsApp() {
  const [theme, setTheme] = useState("light");
  const [backgroundUrl, setBackgroundUrl] = useState("");

  useEffect(() => {
    axios.get("/api/settings").then((res) => {
      setTheme(res.data.theme || "light");
      setBackgroundUrl(res.data.background_url || "");
    });
  }, []);

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await axios.post("/api/settings/theme", { theme: newTheme });
  };

  const handleBackgroundChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("background", file);
    const res = await axios.post("/api/settings/background", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setBackgroundUrl(res.data.background_url);
  };

  const handleSignOut = async () => {
    await axios.post("/api/auth/signout");
    window.location.href = "/login";
  };

  return (
    <div
      className={`settings-app ${theme}`}
      style={{
        minHeight: "100vh",
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "none",
        backgroundSize: "cover",
      }}
    >
      <h2>Settings</h2>

      <section>
        <h3>Theme</h3>
        <button
          onClick={() => handleThemeChange("light")}
          disabled={theme === "light"}
        >
          Light
        </button>
        <button
          onClick={() => handleThemeChange("dark")}
          disabled={theme === "dark"}
        >
          Dark
        </button>
      </section>

      <section>
        <h3>Background image</h3>
        <input type="file" accept="image/*" onChange={handleBackgroundChange} />
      </section>

      <section>
        <h3>Account</h3>
        <button onClick={handleSignOut}>Sign out</button>
      </section>
    </div>
  );
}
