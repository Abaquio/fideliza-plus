import { Router } from "express";
import { login, me, updateMe } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", auth, me);

// ✅ PUT /api/auth/me (editar mi perfil)
router.put("/me", auth, updateMe);

export default router;
