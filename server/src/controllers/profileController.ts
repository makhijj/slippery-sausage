import type { Request, Response } from "express";
import { getProfileService } from "../services/profileService.ts";
import type { JwtPayload } from "jsonwebtoken";

export async function getProfile(req: Request, res: Response) {
  try {
    const user = req.user as JwtPayload;
    const username = user?.username;

    if (!username) {
      return res.status(400).json({ error: "Missing username in token" });
    }

    const data = await getProfileService(username);

    if ("error" in data) {
      return res.status(404).json({ error: data.error });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}
