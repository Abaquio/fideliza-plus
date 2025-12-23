import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerPuntosConfiguracion,
} from "../controllers/configuracion.controller.js";

const router = Router();

router.use(authMiddleware);

// ✅ Reglas de puntos (solo lectura, permitido a roles operativos)
router.get(
  "/puntos",
  requireRoles("Administrador", "Supervisor", "Vendedor", "Operario"),
  obtenerPuntosConfiguracion
);

// Solo Admin
router.get("/", requireRoles("Administrador"), obtenerConfiguracion);
router.put("/", requireRoles("Administrador"), actualizarConfiguracion);

export default router;
