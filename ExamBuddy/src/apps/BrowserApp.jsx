// BrowserApp.jsx
import { useState } from "react";
import axios from "axios";
import "../styles/app.css";

export default function BrowserApp() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeText, setScrapeText] = useState("");

  const searchResources = async (e) => {
    e.preventDefault();
    const res = await axios.get("/api/browser/search", { params: { q: query } });
    setResults(res.data.results);
  };

  const scrape = async (e) => {
    e.preventDefault();
    const res = await axios.post("/api/browser/scrape", { url: scrapeUrl });
    setScrapeText(res.data.text);
  };

  return (
    <div className="browser-app">
      <h2>Resource Browser</h2>

      <section>
        <h3>Search</h3>
        <form onSubmit={searchResources}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search online resources..."
          />
          <button type="submit">Search</button>
        </form>
        <ul>
          {results.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Web scraping</h3>
        <form onSubmit={scrape}>
          <input
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://..."
          />
          <button type="submit">Scrape</button>
        </form>
        {scrapeText && (
          <pre className="scrape-output">
            {scrapeText}
          </pre>
        )}
      </section>
    </div>
  );
}
