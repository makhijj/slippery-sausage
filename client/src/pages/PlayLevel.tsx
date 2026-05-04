import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GamePlayer from "../components/GamePlayer";

type LevelData = {
  height: number;
  spawnPoint: { x: number; y: number } | null;
  tiles: any[];
  enemies: any[];
  checkpoints: any[];
  goal: { x: number; y: number } | null;
};

function PlayLevel() {
  const API = import.meta.env.VITE_API_URL;
  const { username, id } = useParams();
  const navigate = useNavigate();
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLevel() {
      try {
        const res = await fetch(`${API}/levels/${username}/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError("Level not found");
          return;
        }
        setLevelData(data.data);
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchLevel();
  }, []);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1a1a2e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Nunito", sans-serif',
          fontSize: "1.2rem",
          color: "#ffffff",
        }}
      >
        Loading level... 🐾
      </div>
    );

  if (error || !levelData)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1a1a2e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Nunito", sans-serif',
          color: "#ff6b6b",
          fontSize: "1.2rem",
        }}
      >
         {error || "Level not found"}
      </div>
    );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GamePlayer
        levelData={levelData}
        onExit={() => navigate(`/levels/${username}/${id}`)}
      />
    </div>
  );
}

export default PlayLevel;
