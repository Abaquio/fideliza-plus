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
  crearMovimiento,
  actualizarMovimiento, // 👈 IMPORTADO
  eliminarMovimiento,   // 👈 IMPORTADO
} from "../controllers/compras.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRoles("Administrador", "Supervisor", "Vendedor"), listarCompras);
router.get("/meta", requireRoles("Administrador", "Supervisor", "Vendedor"), metaCompras);

// Ajustes manuales
router.get("/ajustes", requireRoles("Administrador", "Supervisor", "Vendedor"), listarAjustes);

// Crear movimiento
router.post(
  "/movimientos",
  requireRoles("Administrador", "Supervisor", "Vendedor"),
  crearMovimiento
);

// ✅ NUEVO: Editar movimiento
router.put(
  "/movimientos/:id",
  requireRoles("Administrador", "Supervisor"),
  actualizarMovimiento
);

// ✅ NUEVO: Eliminar movimiento
router.delete(
  "/movimientos/:id",
  requireRoles("Administrador", "Supervisor"),
  eliminarMovimiento
);

// Compras
router.post("/", requireRoles("Administrador", "Supervisor", "Vendedor"), crearCompra);
router.put("/:id", requireRoles("Administrador", "Supervisor"), actualizarCompra);
router.delete("/:id", requireRoles("Administrador", "Supervisor"), eliminarCompra);

export default router;