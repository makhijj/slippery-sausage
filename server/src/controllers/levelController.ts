import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import {
  createLevelService,
  getUserLevelsService,
  getLevelByIdService,
  getPublicLevelsService,
  updateLevelService,
  deleteLevelService,
} from "../services/levelService.ts";

export async function createLevel(req: Request, res: Response) {
  try {
    const { username } = req.user as JwtPayload;
    const { title, description, data } = req.body;

    if (!title || !description || !data) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const level = await createLevelService(username, title, description, data);
    return res.status(201).json(level);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create level" });
  }
}

export async function getUserLevels(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const levels = await getUserLevelsService(username);
    return res.status(200).json(levels);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch levels" });
  }
}

export async function getLevelById(req: Request, res: Response) {
  try {
    const { username, id } = req.params;
    const level = await getLevelByIdService(username, id);

    if ("error" in level) {
      return res.status(404).json({ error: level.error });
    }

    return res.status(200).json(level);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch level" });
  }
}

export async function getPublicLevels(req: Request, res: Response) {
  try {
    const levels = await getPublicLevelsService();
    return res.status(200).json(levels);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch public levels" });
  }
}

export async function updateLevel(req: Request, res: Response) {
  try {
    const { username } = req.user as JwtPayload;
    const { id } = req.params;
    const update = req.body;

    const level = await updateLevelService(username, id, update);

    if ("error" in level) {
      return res.status(404).json({ error: level.error });
    }

    return res.status(200).json(level);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update level" });
  }
}

export async function deleteLevel(req: Request, res: Response) {
  try {
    const { username } = req.user as JwtPayload;
    const { id } = req.params;

    const result = await deleteLevelService(username, id);

    if ("error" in result) {
      return res.status(404).json({ error: result.error });
    }

    return res.status(200).json({ message: "Level deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete level" });
  }
}
