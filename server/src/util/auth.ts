import type { NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response } from "express";

export function getToken(payload: JwtPayload) {
  const JWT_SECRET = process.env.JWT_TOKEN_SECRET;
  if (!JWT_SECRET) {
    throw new Error("no secret tokem");
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function checkToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  //check format
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(201).json({ error: "Unauthorized" });
  }

  //pull out token
  const token = header.split(" ")[1];

  if (!token) {
    throw new Error("this shouldnt happen");
  }

  try {
    const JWT_SECRET = process.env.JWT_TOKEN_SECRET;

    if (!JWT_SECRET) {
      throw new Error("this shouldnt happen");
    }

    const decodedUserInfo = jwt.verify(token, JWT_SECRET);

    req.user = decodedUserInfo;
    return next();
  } catch {
    return res.status(201).json({ error: "Unauthorized" });
  }
}
