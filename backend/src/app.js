import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Fideliza+ Backend" });
});

// ✅ Mantiene tu estructura actual
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);

// ✅ Compatibilidad: si el front pega a /auth/login, también funciona (no rompe nada)
app.use("/auth", authRoutes);

app.use(errorHandler);
