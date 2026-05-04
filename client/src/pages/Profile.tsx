import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getUsernameFromToken, hasToken } from "../util/util";

type Level = { id: string; username: string; title: string; description: string; createdAt: string };

function Profile() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const username = getUsernameFromToken();

  useEffect(() => {
    if (!hasToken()) { navigate("/login"); return; }
    async function fetchProfile() {
      try {
        const res = await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        if (!res.ok) { setError("Failed to fetch profile"); return; }
        const details = await Promise.all(
          data.levels.map(async (id: string) => {
            const r = await fetch(`${API}/levels/${username}/${id}`);
            return r.json();
          })
        );
        setLevels(details);
      } catch { setError("Something went wrong"); }
      finally { setLoading(false); }
    }
    fetchProfile();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>{username}</h1>
        <p style={{ marginTop: "0.4rem" }}>{levels.length} level{levels.length !== 1 ? "s" : ""} created</p>
        <button className="btn" style={{ marginTop: "1rem" }} onClick={() => navigate(`/levels/${username}`)}>
          Manage levels
        </button>
      </div>

      <div className="container">
        <p className="section-title">My Levels</p>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <div className="msg-error">{error}</div>}
        {!loading && levels.length === 0 && (
          <div className="empty-state">You haven't created any levels yet.</div>
        )}
        <div className="level-grid">
          {levels.map((level) => (
            <div key={level.id} className="card" onClick={() => navigate(`/levels/${username}/${level.id}`)}>
              <div className="card-title">{level.title}</div>
              <div className="card-description">{level.description}</div>
              <div className="card-meta">
                <span>{new Date(level.createdAt).toLocaleDateString()}</span>
                <span>Play</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;