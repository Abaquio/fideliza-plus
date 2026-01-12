import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getDashboardData);

export default router;