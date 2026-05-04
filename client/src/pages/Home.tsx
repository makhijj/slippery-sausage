import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsernameFromToken, hasToken } from "../util/util";

type Level = {
  id: string;
  username: string;
  title: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
};

function Home() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = getUsernameFromToken();
  const loggedIn = hasToken();

  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await fetch(`${API}/levels`);
        const data = await res.json();
        if (!res.ok) { setError("Failed to fetch levels"); return; }
        setLevels(data);
      } catch { setError("Something went wrong"); }
      finally { setLoading(false); }
    }
    fetchLevels();
  }, []);

  const myLevels = levels.filter((l) => l.username === currentUser);
  const otherLevels = levels.filter((l) => l.username !== currentUser);
  const displayLevels = [...myLevels, ...otherLevels];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dog Dash</h1>
        <p style={{ marginTop: "0.5rem" }}>
          A 2D platformer — create levels, share them, and race your friends.
        </p>
        {loggedIn && (
          <button
            className="btn"
            style={{ marginTop: "1rem" }}
            onClick={() => navigate(`/levels/${currentUser}`)}
          >
            Create a level
          </button>
        )}
      </div>

      <div className="container">
        <p className="section-title">Community Levels</p>

        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="msg-error">{error}</p>}
        {!loading && displayLevels.length === 0 && (
          <div className="empty-state">No levels yet. Be the first to create one.</div>
        )}

        <div className="level-grid">
          {displayLevels.map((level) => (
            <div
              key={level.id}
              className="card"
              onClick={() => navigate(`/levels/${level.username}/${level.id}`)}
            >
              <div className="card-title">{level.title}</div>
              <div className="card-description">{level.description}</div>
              <div className="card-meta">
                <span>by {level.username}</span>
                <span>{new Date(level.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;