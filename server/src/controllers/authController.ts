import type { Request, Response } from "express";
import {
  registerUserDataService,
  loginUserDataService,
} from "../services/authService.ts";

type RegisterBody = { username: string; password: string };
type LoginBody = { username: string; password: string };

export async function registerUser(
  req: Request<{}, {}, RegisterBody>,
  res: Response,
) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    const data = await registerUserDataService(username, password);
    if (data?.error === "exists") {
      return res.status(409).json({ error: data.message });
    }

    return res.status(201).json({ message: "Account created" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}

export async function loginUser(
  req: Request<{}, {}, LoginBody>,
  res: Response,
) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    const data = await loginUserDataService(username, password);
    if ("error" in data) {
      return res.status(401).json({ error: data.message });
    }

    return res
      .status(200)
      .json({ message: "Login successful", jwt_token: data.token });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
