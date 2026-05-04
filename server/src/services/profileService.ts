import client from "../config/redis.ts";

export async function getProfileService(username: string) {
  const user = await client.hGetAll(`user:${username}`);

  if (Object.keys(user).length === 0) {
    return { error: "User not found" };
  }

  const levelIds = await client.lRange(`user:${username}:levels`, 0, -1);

  return {
    username: user.username,
    levels: levelIds,
  };
}
