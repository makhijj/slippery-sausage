import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      document.cookie = `token=${data.jwt_token}; path=/; max-age=86400`;
      document.cookie = `username=${username}; path=/; max-age=86400`;
      navigate("/");
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="form-card">
        <h1 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Log in
        </h1>

        {error && <div className="msg-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button className="btn btn-full" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <hr className="divider" />

        <p className="text-muted text-center">
          No account?{" "}
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;