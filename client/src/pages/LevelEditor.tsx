import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, getUsernameFromToken, hasToken } from "../util/util";
import GamePlayer from "../components/GamePlayer";

const BASE_COLS = 40;
const MIN_ROWS = 30;
const MAX_ROWS = 150;
const BASE_CELL = 32;

type Tile = {
  x: number;
  y: number;
  type: "platform" | "spike" | "wall";
  width: number;
  height: number;
  properties: Record<string, unknown>;
};

type Enemy = {
  x: number;
  y: number;
  type: "basic" | "flying";
  width: number;
  height: number;
  properties: Record<string, unknown>;
};

type Checkpoint = {
  x: number;
  y: number;
};

type SpawnPoint = {
  x: number;
  y: number;
};

type LevelData = {
  height: number;
  spawnPoint: SpawnPoint | null;
  tiles: Tile[];
  enemies: Enemy[];
  checkpoints: Checkpoint[];
  goal: { x: number; y: number } | null;
};

type SelectedTool =
  | "platform"
  | "wall"
  | "spike"
  | "basic_enemy"
  | "flying_enemy"
  | "checkpoint"
  | "spawn"
  | "erase"
  | "goal";

function LevelEditor() {
  const API = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cellSize, setCellSize] = useState(BASE_CELL);
  const [levelHeight, setLevelHeight] = useState(MIN_ROWS);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>("platform");
  const [isDrawing, setIsDrawing] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [playReady, setPlayReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cameraY, setCameraY] = useState(0);
  const [levelData, setLevelData] = useState<LevelData>({
    height: MIN_ROWS,
    spawnPoint: null,
    tiles: [],
    enemies: [],
    checkpoints: [],
    goal: null,
  });

  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  //load textures
  useEffect(() => {
    const toLoad = ["platform", "wall", "spike", "goal", "flying_enemy", "checkpoint", "basic_enemy", "spawn"];
    let loaded = 0;

    toLoad.forEach((name) => {
      const img = new Image();
      img.src = `/assets/${name}.png`;
      img.onload = () => {
        imagesRef.current[name] = img;
        loaded++;
        if (loaded === toLoad.length) setImagesLoaded(true);
      };
      img.onerror = () => {
        // if no texture
        loaded++;
        if (loaded === toLoad.length) setImagesLoaded(true);
      };
    });
  }, []);

  //recalculate cell size and scroll to bottom 
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const newCellSize = Math.floor(width / BASE_COLS);
      setCellSize(newCellSize);
      const visibleRows = Math.floor(height / newCellSize);
      setCameraY(Math.max(0, levelHeight - visibleRows));
    }

    const timeout = setTimeout(handleResize, 50);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [levelHeight]);

  //load level data
  useEffect(() => {
    if (!hasToken()) {
      navigate("/login");
      return;
    }

    async function fetchLevel() {
      try {
        const username = getUsernameFromToken();
        const res = await fetch(`${API}/levels/${username}/${id}`);
        const data = await res.json();
        if (res.ok && data.data) {
          setLevelData(data.data);
          setLevelHeight(data.data.height || MIN_ROWS);
        }
      } catch {
        setError("Failed to load level");
      }
    }

    fetchLevel();
  }, [id]);

  //draw the editor 
  useEffect(() => {
    if (playMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const visibleRows = Math.ceil(canvas.height / cellSize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //grid lines
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 0.5;
    for (let col = 0; col <= BASE_COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * cellSize, 0);
      ctx.lineTo(col * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let row = 0; row <= visibleRows; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * cellSize);
      ctx.lineTo(canvas.width, row * cellSize);
      ctx.stroke();
    }

    //calculate proper y val
    function toScreenY(levelY: number) {
      return (levelHeight - 1 - levelY - cameraY) * cellSize;
    }

    //blocks
    levelData.tiles.forEach((tile) => {
      const screenY = toScreenY(tile.y);
      if (screenY < -cellSize * tile.height || screenY > canvas.height) return;
      const x = tile.x * cellSize;
      const img = imagesRef.current[tile.type];

      if (img) {
        for (let col = 0; col < tile.width; col++) {
          for (let row = 0; row < tile.height; row++) {
            ctx.drawImage(img, x + col * cellSize, screenY + row * cellSize, cellSize, cellSize);
          }
        }
      } else {
        ctx.fillStyle = tile.type === "platform" ? "#4a9eff" : tile.type === "wall" ? "#888888" : "#ff4444";
        ctx.fillRect(x, screenY, tile.width * cellSize, tile.height * cellSize);
      }
    });

    //enemies
    levelData.enemies.forEach((enemy) => {
      const screenY = toScreenY(enemy.y);
      if (screenY < -cellSize * enemy.height || screenY > canvas.height) return;

      if (enemy.type === "flying") {
        const sawImg = imagesRef.current["flying_enemy"];
        const patrolRange = 10;
        const pathStartX = enemy.x * cellSize - (patrolRange / 2) * cellSize;

        //path range indicator
        ctx.fillStyle = "rgba(255, 0, 255, 0.1)";
        ctx.fillRect(pathStartX, screenY, patrolRange * cellSize, cellSize);
        ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(pathStartX, screenY, patrolRange * cellSize, cellSize);
        ctx.setLineDash([]);

        if (sawImg) {
          //get frames from spritesheet
          ctx.drawImage(sawImg, 0, 0, 32, 32, enemy.x * cellSize, screenY, cellSize, cellSize);
        } else {
          ctx.fillStyle = "#ff00ff";
          ctx.fillRect(enemy.x * cellSize, screenY, cellSize, cellSize);
        }
      } else {
        const enemyImg = imagesRef.current["basic_enemy"];
        if (enemyImg) {
          ctx.drawImage(enemyImg, enemy.x * cellSize, screenY, enemy.width * cellSize, enemy.height * cellSize);
        } else {
          ctx.fillStyle = "#ff8800";
          ctx.fillRect(enemy.x * cellSize, screenY, enemy.width * cellSize, enemy.height * cellSize);
        }
      }
    });

    //checkpoints
    levelData.checkpoints.forEach((cp) => {
      const screenY = toScreenY(cp.y);
      if (screenY < -cellSize * 2 || screenY > canvas.height) return;
      const cpImg = imagesRef.current["checkpoint"];
      if (cpImg) {
        ctx.drawImage(cpImg, cp.x * cellSize, screenY, cellSize, cellSize * 2);
      } else {
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(cp.x * cellSize, screenY, cellSize, cellSize * 2);
      }
    });

    //spawn point
    if (levelData.spawnPoint) {
      const screenY = toScreenY(levelData.spawnPoint.y);
      if (screenY >= -cellSize * 2 && screenY <= canvas.height) {
        const spawnImg = imagesRef.current["spawn"];
        if (spawnImg) {
          ctx.drawImage(spawnImg, levelData.spawnPoint.x * cellSize, screenY, cellSize, cellSize * 2);
        } else {
          ctx.fillStyle = "#ffff00";
          ctx.fillRect(levelData.spawnPoint.x * cellSize, screenY, cellSize, cellSize * 2);
        }
      }
    }

    //goal
    if (levelData.goal) {
      const screenY = toScreenY(levelData.goal.y);
      if (screenY >= -cellSize * 2 && screenY <= canvas.height) {
        const goalImg = imagesRef.current["goal"];
        if (goalImg) {
          ctx.drawImage(goalImg, levelData.goal.x * cellSize, screenY, cellSize * 2, cellSize * 2);
        } else {
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(levelData.goal.x * cellSize, screenY, cellSize * 2, cellSize * 2);
        }
      }
    }

    //scrollbar
    const thumbHeight = Math.max(20, (visibleRows / levelHeight) * canvas.height);
    const maxScroll = levelHeight - visibleRows;
    const thumbY = maxScroll > 0 ? (cameraY / maxScroll) * (canvas.height - thumbHeight) : 0;
    ctx.fillStyle = "#ffffff22";
    ctx.fillRect(canvas.width - 8, 0, 6, canvas.height);
    ctx.fillStyle = "#ffffff88";
    ctx.fillRect(canvas.width - 8, thumbY, 6, thumbHeight);

  }, [levelData, cellSize, levelHeight, cameraY, playMode, imagesLoaded]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const visibleRows = Math.ceil(canvas.height / cellSize);
    const delta = e.deltaY > 0 ? -1 : 1;
    setCameraY((prev) => Math.max(0, Math.min(levelHeight - visibleRows, prev + delta)));
  }

  function getGridCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const screenRow = Math.floor((e.clientY - rect.top) / cellSize);
    const levelY = levelHeight - 1 - screenRow - cameraY;
    if (col < 0 || col >= BASE_COLS || levelY < 0 || levelY >= levelHeight) return null;
    return { x: col, y: Math.floor(levelY) };
  }

  function placeElement(coords: { x: number; y: number }) {
    setLevelData((prev) => {
      const next = { ...prev };

      if (selectedTool === "erase") {
        next.tiles = prev.tiles.filter((t) => !(t.x === coords.x && t.y === coords.y));
        next.enemies = prev.enemies.filter((e) => !(e.x === coords.x && e.y === coords.y));
        next.checkpoints = prev.checkpoints.filter((c) => !(c.x === coords.x && c.y === coords.y));
        if (prev.spawnPoint?.x === coords.x && prev.spawnPoint?.y === coords.y) next.spawnPoint = null;
        if (prev.goal?.x === coords.x && prev.goal?.y === coords.y) next.goal = null;
        return next;
      }

      if (selectedTool === "spawn") {
        next.spawnPoint = { x: coords.x, y: coords.y };
        return next;
      }

      if (selectedTool === "goal") {
        next.goal = { x: coords.x, y: coords.y };
        return next;
      }

      if (selectedTool === "checkpoint") {
        if (!prev.checkpoints.some((c) => c.x === coords.x && c.y === coords.y)) {
          next.checkpoints = [...prev.checkpoints, { x: coords.x, y: coords.y }];
        }
        return next;
      }

      if (selectedTool === "platform" || selectedTool === "wall" || selectedTool === "spike") {
        if (!prev.tiles.some((t) => t.x === coords.x && t.y === coords.y)) {
          next.tiles = [...prev.tiles, {
            x: coords.x,
            y: coords.y,
            type: selectedTool as "platform" | "wall" | "spike",
            width: selectedTool === "platform" ? 2 : 1,
            height: 1,
            properties: {},
          }];
        }
        return next;
      }

      if (selectedTool === "basic_enemy" || selectedTool === "flying_enemy") {
        if (!prev.enemies.some((e) => e.x === coords.x && e.y === coords.y)) {
          next.enemies = [...prev.enemies, {
            x: coords.x,
            y: coords.y,
            type: selectedTool === "basic_enemy" ? "basic" : "flying",
            width: 1,
            height: selectedTool === "basic_enemy" ? 2 : 1,
            properties: {},
          }];
        }
        return next;
      }

      return next;
    });
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const coords = getGridCoords(e);
    if (coords) placeElement(coords);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const coords = getGridCoords(e);
    if (coords) placeElement(coords);
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const username = getUsernameFromToken();
      const res = await fetch(`${API}/levels/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ data: { ...levelData, height: levelHeight } }),
      });

      if (!res.ok) {
        setError("Failed to save level");
        return;
      }

      navigate(`/levels/${username}/${id}`);
    } catch {
      setError("Failed to save level");
    } finally {
      setSaving(false);
    }
  }

  const toolColors: Record<SelectedTool, string> = {
    platform: "#4a9eff",
    wall: "#888888",
    spike: "#ff4444",
    basic_enemy: "#ff8800",
    flying_enemy: "#ff00ff",
    checkpoint: "#00ff88",
    spawn: "#ffff00",
    erase: "#ff0000",
    goal: "#ffd700",
  };

  const tools: SelectedTool[] = [
    "platform", "wall", "spike",
    "basic_enemy", "flying_enemy",
    "checkpoint", "spawn", "goal", "erase",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#111" }}>

      {!playMode && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", background: "#222", flexWrap: "wrap" }}>
          {tools.map((tool) => (
            <button
              key={tool}
              onClick={() => setSelectedTool(tool)}
              style={{
                padding: "0.4rem 0.8rem",
                background: selectedTool === tool ? toolColors[tool] : "#444",
                color: selectedTool === tool ? "#000" : "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: selectedTool === tool ? "bold" : "normal",
                textTransform: "capitalize",
              }}
            >
              {tool.replace("_", " ")}
            </button>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem" }}>
            <label style={{ color: "#fff", fontSize: "0.85rem" }}>Height:</label>
            <input
              type="number"
              min={MIN_ROWS}
              max={MAX_ROWS}
              value={levelHeight}
              onChange={(e) => {
                const val = Math.max(MIN_ROWS, Math.min(MAX_ROWS, parseInt(e.target.value) || MIN_ROWS));
                setLevelHeight(val);
                setLevelData((prev) => ({ ...prev, height: val }));
              }}
              style={{ width: "70px", padding: "0.3rem" }}
            />
          </div>

          <button
            onClick={() => {
              setPlayMode(true);
              setPlayReady(false);
              setPlayKey((prev) => prev + 1);
              setTimeout(() => setPlayReady(true), 50);
            }}
            style={{
              padding: "0.4rem 1rem",
              background: "#00aa44",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Play
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginLeft: "auto",
              padding: "0.4rem 1rem",
              background: "#0066cc",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>

          {error && <p style={{ color: "red", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
        </div>
      )}

      {!playMode && (
        <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={containerRef.current?.clientWidth || window.innerWidth}
            height={containerRef.current?.clientHeight || window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ display: "block", cursor: "crosshair" }}
          />
        </div>
      )}

      {playMode && (
        <div style={{ flex: 1 }}>
          {playReady && (
            <GamePlayer
              key={playKey}
              levelData={{ ...levelData, height: levelHeight }}
              onExit={() => {
                setPlayMode(false);
                setPlayReady(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default LevelEditor;