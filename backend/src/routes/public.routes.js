import { Router } from "express";
import { registrarClientePublico, solicitarBordado } from "../controllers/public.controller.js";

const router = Router();

// Esta ruta es totalmente abierta (Registro Fideliza+)
router.post("/registro", registrarClientePublico);

// ✅ NUEVO: Ruta abierta para recibir las solicitudes de bordado
router.post("/bordado", solicitarBordado);

export default router;