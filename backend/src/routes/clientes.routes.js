import { Router } from "express"
import {
  listarClientes,
  crearCliente,
  actualizarCliente, // ✅ NUEVO
  importarClientes,
  listarFuentesClientes,
  crearFuenteClientes,
  actualizarFuenteClientes,
  recargarFuenteClientes,
  eliminarFuenteClientes,
} from "../controllers/clientes.controller.js"

const router = Router()

// ✅ Clientes
router.get("/", listarClientes)
router.post("/", crearCliente)

// ✅ NUEVO: editar cliente
router.patch("/:id", actualizarCliente)

// ✅ Importar (mantiene lo que ya usas)
router.post("/importar", importarClientes)

// ✅ Fuentes
router.get("/fuentes", listarFuentesClientes)
router.post("/fuentes", crearFuenteClientes)
router.patch("/fuentes/:id", actualizarFuenteClientes)
router.post("/fuentes/:id/recargar", recargarFuenteClientes)

// ✅ eliminar fuente (opcional: cascade=true)
router.delete("/fuentes/:id", eliminarFuenteClientes)

export default router
