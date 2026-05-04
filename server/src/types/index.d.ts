// This file merely makes sure that certain types in the Express Request object are available globally.
// This file should NOT be modified or imported anywhere!

import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: string | JwtPayload;
  }
}

export type Tile = {
  x: number;
  y: number;
  type: "platform" | "spike" | "wall";
};

export type Enemy = {
  x: number;
  y: number;
  type: "basic" | "flying";
};

export type Checkpoint = {
  x: number;
  y: number;
};

export type LevelData = {
  tiles: Tile[];
  enemies: Enemy[];
  checkpoints: Checkpoint[];
};

export type Level = {
  id: string;
  username: string;
  title: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  data: LevelData;
};
