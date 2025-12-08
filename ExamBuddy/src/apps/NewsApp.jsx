// NewsApp.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/app.css";

export default function NewsApp() {
  const [domain, setDomain] = useState("ai");
  const [articles, setArticles] = useState([]);

  const loadNews = async (dom) => {
    const res = await axios.get("/api/news", { params: { domain: dom } });
    setArticles(res.data.articles);
  };

  useEffect(() => {
    loadNews(domain);
  }, []);

  return (
    <div className="news-app">
      <h2>Domain News</h2>
      <select
        value={domain}
        onChange={(e) => {
          const d = e.target.value;
          setDomain(d);
          loadNews(d);
        }}
      >
        <option value="ai">AI</option>
        <option value="webdev">Web Development</option>
        <option value="cs">Computer Science</option>
      </select>
      <ul>
        {articles.map((a) => (
          <li key={a.id}>
            <a href={a.url} target="_blank" rel="noreferrer">
              {a.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
