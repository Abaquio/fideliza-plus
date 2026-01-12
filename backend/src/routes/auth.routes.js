import { Router } from "express";
import {
  login,
  refresh,
  me,
  updateMe,
  updateMyPassword,
} from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);

router.get("/me", auth, me);
router.put("/me", auth, updateMe);

// ✅ NUEVO: cambiar contraseña (verifica actual real)
router.put("/me/password", auth, updateMyPassword);

export default router;
