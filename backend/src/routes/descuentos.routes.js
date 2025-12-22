import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";
import {
  listarCupones,
  metaDescuentos,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
} from "../controllers/descuentos.controller.js";

const router = Router();

router.use(authMiddleware);

// ✅ Lectura: Administrador + Vendedor
router.get("/", requireRoles("Administrador", "Vendedor"), listarCupones);
router.get("/meta", requireRoles("Administrador", "Vendedor"), metaDescuentos);

// ✅ Escritura: solo Administrador
router.post("/", requireRoles("Administrador"), crearCupon);
router.put("/:id", requireRoles("Administrador"), actualizarCupon);
router.delete("/:id", requireRoles("Administrador"), eliminarCupon);

export default router;
