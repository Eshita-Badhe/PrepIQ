// NewsApp.jsx
import React, { useState } from "react";

const CATEGORIES = ["All", "Breaches", "Mobile", "Cloud", "Best Practices"];

const MOCK_NEWS = [
  {
    id: 1,
    category: "Breaches",
    title: "Major analytics provider reports data exposure impacting multiple AI platforms",
    source: "Cyber Daily",
    time: "2 hours ago",
    summary:
      "Incident involved misconfigured access to logs; investigation suggests limited customer impact but highlights the need for stricter access controls.",
    tag: "Data Breach",
  },
  {
    id: 2,
    category: "Mobile",
    title: "New Android banking trojan disguises itself as a productivity app",
    source: "Mobile Threat Lab",
    time: "4 hours ago",
    summary:
      "Researchers found a malware family using accessibility permissions to overlay fake login screens and intercept one-time passwords.",
    tag: "Mobile Malware",
  },
  {
    id: 3,
    category: "Cloud",
    title: "Misconfigured cloud storage exposes internal IT documentation",
    source: "Cloud Security Watch",
    time: "Today",
    summary:
      "An open storage bucket containing network diagrams and server runbooks was indexed by search engines before being locked down.",
    tag: "Cloud Misconfig",
  },
  {
    id: 4,
    category: "Best Practices",
    title: "Universities push least‑privilege policies ahead of exam season",
    source: "Campus Cyber News",
    time: "Yesterday",
    summary:
      "Academic IT teams are tightening access controls on exam systems, limiting admin rights and enforcing multi‑factor authentication.",
    tag: "Policy",
  },
];

export default function NewsApp() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredNews = MOCK_NEWS.filter((item) => {
    const catMatch =
      selectedCategory === "All" || item.category === selectedCategory;
    const term = search.trim().toLowerCase();
    const searchMatch =
      !term ||
      item.title.toLowerCase().includes(term) ||
      item.summary.toLowerCase().includes(term);
    return catMatch && searchMatch;
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        borderRadius: 18,
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #f3f4f6 45%, #e5e7eb 100%)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
        boxShadow: "0 20px 40px rgba(15,23,42,0.14)",
        border: "1px solid rgba(148,163,184,0.45)",
        overflow: "hidden",
      }}
    >
      {/* Left: filters and sources */}
      <div
        style={{
          width: 260,
          background: "#f9fafb",
          borderRight: "1px solid rgba(148,163,184,0.5)",
          display: "flex",
          flexDirection: "column",
          padding: 10,
          boxSizing: "border-box",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Cyber Security News
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search headlines..."
          style={{
            padding: "7px 10px",
            borderRadius: 9999,
            border: "1px solid rgba(148,163,184,0.8)",
            background: "#ffffff",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />

        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Categories
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 9999,
                  border: active
                    ? "1px solid #3b82f6"
                    : "1px solid rgba(148,163,184,0.7)",
                  background: active ? "#eff6ff" : "#ffffff",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          Prototype: all articles are predefined mock items focused on exam‑relevant
          cyber security stories.
        </div>
      </div>

      {/* Right: news feed */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(148,163,184,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Today’s Highlights
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            {selectedCategory === "All"
              ? "All categories"
              : `Filtered by: ${selectedCategory}`}
            {" · "}
            {filteredNews.length} stories
          </div>
        </div>

        {/* Feed list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background:
              "radial-gradient(circle at top,#f9fafb 0,#ffffff 45%)",
          }}
        >
          {filteredNews.map((item) => (
            <article
              key={item.id}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.7)",
                background: "#ffffff",
                boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                  fontSize: "0.75rem",
                }}
              >
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 9999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 600,
                  }}
                >
                  {item.tag}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {item.source} · {item.time}
                </span>
              </div>

              <h3
                style={{
                  margin: "2px 0 4px",
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#4b5563",
                }}
              >
                {item.summary}
              </p>

              <div
                style={{
                  marginTop: 6,
                  fontSize: "0.75rem",
                  color: "#3b82f6",
                  cursor: "pointer",
                }}
              >
                Read more (prototype)
              </div>
            </article>
          ))}

          {filteredNews.length === 0 && (
            <div
              style={{
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              No stories match your search/filter in this prototype.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
