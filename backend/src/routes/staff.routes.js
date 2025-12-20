import { Router } from "express";
import {
  listarStaff,
  crearStaff,
  cambiarEstadoStaff,
} from "../controllers/staff.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";

const router = Router();

router.use(authMiddleware);

// Solo admin puede gestionar staff
router.get("/", requireRoles("admin"), listarStaff);
router.post("/", requireRoles("admin"), crearStaff);
router.put("/:id/estado", requireRoles("admin"), cambiarEstadoStaff);

export default router;
