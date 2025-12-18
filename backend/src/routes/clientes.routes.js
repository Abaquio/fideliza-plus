import { Router } from "express"
import { listarClientes, crearCliente } from "../controllers/clientes.controller.js"

const router = Router()

// ✅ BETA: sin auth (después lo volvemos a poner)
router.get("/", listarClientes)
router.post("/", crearCliente)

export default router
