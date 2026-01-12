import { Router } from "express";
import { registrarClientePublico } from "../controllers/public.controller.js";

const router = Router();

// Esta ruta es totalmente abierta
router.post("/registro", registrarClientePublico);

export default router;