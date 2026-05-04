import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="form-card">
        <h1 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Register
        </h1>

        {error && <div className="msg-error">{error}</div>}
        {success && <div className="msg-success">{success}</div>}

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        <button className="btn btn-full" onClick={handleRegister} disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <hr className="divider" />

        <p className="text-muted text-center">
          Already have an account?{" "}
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/login")}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;