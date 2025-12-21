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

// Puedes ajustar roles después si quieres (por ahora, seguro):
router.get("/", requireRoles("Administrador"), listarCupones);
router.get("/meta", requireRoles("Administrador"), metaDescuentos);
router.post("/", requireRoles("Administrador"), crearCupon);
router.put("/:id", requireRoles("Administrador"), actualizarCupon);
router.delete("/:id", requireRoles("Administrador"), eliminarCupon);

export default router;
