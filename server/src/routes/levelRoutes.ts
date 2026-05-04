import { Router } from "express";
import {
  createLevel,
  getUserLevels,
  getLevelById,
  getPublicLevels,
  updateLevel,
  deleteLevel,
} from "../controllers/levelController.ts";
import { checkToken } from "../util/auth.ts";

const router = Router();

router.get("/levels", getPublicLevels);
router.post("/levels", checkToken, createLevel);
router.get("/levels/:username", getUserLevels);
router.get("/levels/:username/:id", getLevelById);
router.patch("/levels/:id", checkToken, updateLevel);
router.delete("/levels/:id", checkToken, deleteLevel);

export default router;
