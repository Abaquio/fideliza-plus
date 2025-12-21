import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";
import { obtenerConfiguracion, actualizarConfiguracion } from "../controllers/configuracion.controller.js";

const router = Router();

router.use(authMiddleware);

// Solo Admin (igual que staff)
router.get("/", requireRoles("Administrador"), obtenerConfiguracion);
router.put("/", requireRoles("Administrador"), actualizarConfiguracion);

export default router;
