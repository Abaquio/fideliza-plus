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
  crearMovimiento, // ✅ NUEVO
} from "../controllers/compras.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRoles("Administrador", "Supervisor", "Vendedor"), listarCompras);
router.get("/meta", requireRoles("Administrador", "Supervisor", "Vendedor"), metaCompras);

// ✅ Ajustes manuales (puntos_movimientos tipo=ajuste) + ahora también canje si ya lo ajustaste en controller
router.get("/ajustes", requireRoles("Administrador", "Supervisor", "Vendedor"), listarAjustes);

// ✅ NUEVO: crear movimiento (ajuste / canje)
router.post(
  "/movimientos",
  requireRoles("Administrador", "Supervisor", "Vendedor"),
  crearMovimiento
);

router.post("/", requireRoles("Administrador", "Supervisor", "Vendedor"), crearCompra);

router.put("/:id", requireRoles("Administrador", "Supervisor"), actualizarCompra);
router.delete("/:id", requireRoles("Administrador", "Supervisor"), eliminarCompra);

export default router;
