import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken, getUsernameFromToken, hasToken } from "../util/util";

type Level = { id: string; username: string; title: string; description: string; isPublic: boolean; createdAt: string; data: object };

function LevelDetail() {
  const API = import.meta.env.VITE_API_URL;
  const { username, id } = useParams();
  const navigate = useNavigate();
  const currentUser = getUsernameFromToken();
  const isOwner = currentUser === username;

  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchLevel() {
      try {
        const res = await fetch(`${API}/levels/${username}/${id}`);
        const data = await res.json();
        if (!res.ok) { setError("Level not found"); return; }
        setLevel(data); setEditTitle(data.title); setEditDescription(data.description);
      } catch { setError("Something went wrong"); }
      finally { setLoading(false); }
    }
    fetchLevel();
  }, []);

  async function handleDelete() {
    if (!confirm("Delete this level?")) return;
    try {
      const res = await fetch(`${API}/levels/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) { setError("Failed to delete"); return; }
      navigate(`/levels/${username}`);
    } catch { setError("Something went wrong"); }
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/levels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Failed to update"); return; }
      setLevel(data); setEditing(false);
    } catch { setError("Something went wrong"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><p className="text-muted">Loading...</p></div>;
  if (error) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="msg-error">{error}</div></div>;
  if (!level) return null;

  return (
    <div className="page">
      <div className="page-header">
        {editing ? (
          <div style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
            <input className="form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
            <div className="btn-row">
              <button className="btn" onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "Nunito, sans-serif", fontSize: "1.5rem" }}>{level.title}</h1>
            <p style={{ marginTop: "0.35rem", color: "#666" }}>{level.description}</p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#999" }}>
              by {level.username} · {new Date(level.createdAt).toLocaleDateString()}
            </p>
          </>
        )}
      </div>

      <div className="container" style={{ maxWidth: "600px" }}>
        {error && <div className="msg-error">{error}</div>}

        <button className="btn btn-full" style={{ marginBottom: "0.75rem" }} onClick={() => navigate(`/play/${username}/${id}`)}>
          Play
        </button>

        {isOwner && hasToken() && (
          <div className="btn-row">
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/editor/${id}`)}>Edit level</button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(true)}>Edit info</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
          </div>
        )}

        <hr className="divider" />
        <span
          style={{ fontSize: "0.85rem", color: "#666", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate(`/levels/${username}`)}
        >
          Back to {username}'s levels
        </span>
      </div>
    </div>
  );
}

export default LevelDetail;