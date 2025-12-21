import { Router } from "express";
import {
  listarStaff,
  metaStaff,
  crearStaff,
  actualizarStaff,
  enviarResetPassword,
  cambiarEstadoStaff,
} from "../controllers/staff.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";

const router = Router();

router.use(authMiddleware);

// Solo Administrador gestiona staff
router.get("/", requireRoles("Administrador"), listarStaff);
router.get("/meta", requireRoles("Administrador"), metaStaff);
router.post("/", requireRoles("Administrador"), crearStaff);

// Editar usuario (email/password opcional)
router.put("/:id", requireRoles("Administrador"), actualizarStaff);

// Enviar correo de recuperación (opción por correo)
router.post("/:id/reset-password", requireRoles("Administrador"), enviarResetPassword);

// Mantengo por compat
router.put("/:id/estado", requireRoles("Administrador"), cambiarEstadoStaff);

export default router;
