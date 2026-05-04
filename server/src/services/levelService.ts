import client from "../config/redis.ts";
import { createId } from "@paralleldrive/cuid2";

export type LevelData = {
  tiles: object[];
  enemies: object[];
  checkpoints: object[];
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

export async function createLevelService(
  username: string,
  title: string,
  description: string,
  data: LevelData,
) {
  const id = createId();

  const level: Level = {
    id,
    username,
    title,
    description,
    isPublic: true,
    createdAt: new Date().toISOString(),
    data,
  };

  await client.hSet(`level:${id}`, {
    id,
    username,
    title,
    description,
    isPublic: "true",
    createdAt: level.createdAt,
    data: JSON.stringify(data),
  });

  await client.rPush(`user:${username}:levels`, id);
  await client.rPush("public:levels", id);

  return level;
}

export async function getUserLevelsService(username: string) {
  const levelIds = await client.lRange(`user:${username}:levels`, 0, -1);

  const levels: Level[] = [];

  for (const id of levelIds) {
    const level = await client.hGetAll(`level:${id}`);
    if (level.id) {
      levels.push({
        id: level.id,
        username: level.username,
        title: level.title,
        description: level.description,
        isPublic: level.isPublic === "true",
        createdAt: level.createdAt,
        data: JSON.parse(level.data),
      });
    }
  }

  return levels;
}

export async function getLevelByIdService(username: string, id: string) {
  const level = await client.hGetAll(`level:${id}`);

  if (Object.keys(level).length === 0) {
    return { error: "Level not found" };
  }

  if (level.username !== username) {
    return { error: "Level not found" };
  }

  return {
    id: level.id,
    username: level.username,
    title: level.title,
    description: level.description,
    isPublic: level.isPublic === "true",
    createdAt: level.createdAt,
    data: JSON.parse(level.data),
  };
}

export async function getPublicLevelsService() {
  const levelIds = await client.lRange("public:levels", 0, -1);

  const levels: Level[] = [];

  for (const id of levelIds) {
    const level = await client.hGetAll(`level:${id}`);
    if (level.id && level.isPublic === "true") {
      levels.push({
        id: level.id,
        username: level.username,
        title: level.title,
        description: level.description,
        isPublic: true,
        createdAt: level.createdAt,
        data: JSON.parse(level.data),
      });
    }
  }

  return levels;
}

export async function updateLevelService(
  username: string,
  id: string,
  update: {
    title?: string;
    description?: string;
    data?: LevelData;
    isPublic?: boolean;
  },
) {
  const level = await client.hGetAll(`level:${id}`);

  if (Object.keys(level).length === 0) {
    return { error: "Level not found" };
  }

  if (level.username !== username) {
    return { error: "Unauthorized" };
  }

  if (update.title) await client.hSet(`level:${id}`, { title: update.title });
  if (update.description)
    await client.hSet(`level:${id}`, { description: update.description });
  if (update.data)
    await client.hSet(`level:${id}`, { data: JSON.stringify(update.data) });
  if (update.isPublic !== undefined)
    await client.hSet(`level:${id}`, { isPublic: String(update.isPublic) });

  const updated = await client.hGetAll(`level:${id}`);

  return {
    id: updated.id,
    username: updated.username,
    title: updated.title,
    description: updated.description,
    isPublic: updated.isPublic === "true",
    createdAt: updated.createdAt,
    data: JSON.parse(updated.data),
  };
}

export async function deleteLevelService(username: string, id: string) {
  const level = await client.hGetAll(`level:${id}`);

  if (Object.keys(level).length === 0) {
    return { error: "Level not found" };
  }

  if (level.username !== username) {
    return { error: "Unauthorized" };
  }

  await client.del(`level:${id}`);
  await client.lRem(`user:${username}:levels`, 0, id);
  await client.lRem("public:levels", 0, id);

  return { success: true };
}
