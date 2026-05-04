import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.ts";
import client from "./config/redis.ts";
import profileRoutes from "./routes/profileRoutes.ts";
import levelRoutes from "./routes/levelRoutes.ts";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://slipperysausage.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use(authRoutes);
app.use(profileRoutes);
app.use(levelRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
