import client from "../config/redis.ts";
import bcrypt from "bcryptjs";
import { getToken } from "../util/auth.ts";

type LoginResult = { token: string } | { error: string; message: string };

export async function registerUserDataService(
  username: string,
  password: string,
) {
  const existing = await client.hGetAll(`user:${username}`);
  if (Object.keys(existing).length > 0) {
    return { error: "exists", message: "Username already taken" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await client.hSet(`user:${username}`, { username, passwordHash });
  return;
}

export async function loginUserDataService(
  username: string,
  password: string,
): Promise<LoginResult> {
  const user = await client.hGetAll(`user:${username}`);
  if (Object.keys(user).length === 0) {
    return { error: "invalid", message: "User not found" };
  }

  const correct = await bcrypt.compare(password, user.passwordHash);
  if (!correct) {
    return { error: "invalid", message: "Incorrect password" };
  }

  const token = getToken({ username: user.username });
  return { token };
}
