import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roles.js";
import {
  listarCompras,
  metaCompras,
  crearCompra,
  actualizarCompra,
  eliminarCompra,
  listarAjustes,
} from "../controllers/compras.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRoles("Administrador", "Supervisor", "Vendedor"), listarCompras);
router.get("/meta", requireRoles("Administrador", "Supervisor", "Vendedor"), metaCompras);

// ✅ Ajustes manuales (puntos_movimientos tipo=ajuste)
router.get("/ajustes", requireRoles("Administrador", "Supervisor", "Vendedor"), listarAjustes);

router.post("/", requireRoles("Administrador", "Supervisor", "Vendedor"), crearCompra);

router.put("/:id", requireRoles("Administrador", "Supervisor"), actualizarCompra);
router.delete("/:id", requireRoles("Administrador", "Supervisor"), eliminarCompra);

export default router;
