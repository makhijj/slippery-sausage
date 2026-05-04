import { Router } from "express";
import { getProfile } from "../controllers/profileController.ts";
import { checkToken } from "../util/auth.ts";

const router = Router();

router.get("/profile", checkToken, getProfile);

export default router;
