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
app.use(express.json());
app.use(morgan("dev"));

// ✅ CORS "pro" sin romper local/prod
const corsOptions = {
  origin: (origin, callback) => {
    // Requests sin Origin (Postman, curl, healthchecks, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = env.CORS_ORIGINS.includes(origin);
    if (allowed) return callback(null, true);

    return callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));

// ✅ FIX: evita app.options("*", ...) que rompe por path-to-regexp en tu stack
// Preflight global:
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Fideliza+ Backend" });
});

// ✅ Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);

// ✅ Compatibilidad antigua (si tu front pegaba /auth/login)
app.use("/auth", authRoutes);

app.use(errorHandler);
