import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken, getUsernameFromToken, hasToken } from "../util/util";

type Level = { id: string; username: string; title: string; description: string; isPublic: boolean; createdAt: string };

function UserLevels() {
  const API = import.meta.env.VITE_API_URL;
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = getUsernameFromToken();
  const isOwner = currentUser === username;

  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchLevels() {
      try {
        const res = await fetch(`${API}/levels/${username}`);
        const data = await res.json();
        if (!res.ok) { setError("Failed to fetch levels"); return; }
        setLevels(data);
      } catch { setError("Something went wrong"); }
      finally { setLoading(false); }
    }
    fetchLevels();
  }, [username]);

  async function handleCreate() {
    if (!newTitle || !newDescription) { setError("Please fill in all fields"); return; }
    setCreating(true);
    try {
      const res = await fetch(`${API}/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          title: newTitle, description: newDescription,
          data: { tiles: [], enemies: [], checkpoints: [], height: 30, spawnPoint: null, goal: null },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Failed to create level"); return; }
      setLevels([...levels, data]);
      setNewTitle(""); setNewDescription(""); setShowCreate(false);
    } catch { setError("Something went wrong"); }
    finally { setCreating(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isOwner ? "My Levels" : `${username}'s Levels`}</h1>
        <p style={{ marginTop: "0.4rem" }}>{levels.length} level{levels.length !== 1 ? "s" : ""}</p>
        {isOwner && hasToken() && !showCreate && (
          <button className="btn" style={{ marginTop: "1rem" }} onClick={() => setShowCreate(true)}>
            New level
          </button>
        )}
      </div>

      <div className="container">
        {error && <div className="msg-error">{error}</div>}

        {showCreate && (
          <div style={{ border: "1px solid #e5e5e5", borderRadius: "4px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p className="section-title" style={{ marginBottom: "1rem" }}>New Level</p>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="Level name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Describe your level" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <div className="btn-row">
              <button className="btn" onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create"}</button>
              <button className="btn btn-outline" onClick={() => { setShowCreate(false); setNewTitle(""); setNewDescription(""); setError(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {loading && <p className="text-muted">Loading...</p>}
        {!loading && levels.length === 0 && (
          <div className="empty-state">
            {isOwner ? "You haven't created any levels yet." : `${username} hasn't created any levels yet.`}
          </div>
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

export default UserLevels;