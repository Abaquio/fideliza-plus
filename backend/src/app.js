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

// ✅ CORS robusto (local + prod)
const corsOptions = {
  origin: (origin, callback) => {
    // Requests sin Origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/$/, "");

    const allowedExact = env.CORS_ORIGINS.includes(normalized);
    const allowedVercelPreview =
      env.ALLOW_VERCEL_PREVIEWS &&
      /^https:\/\/.+\.vercel\.app$/.test(normalized);

    if (allowedExact || allowedVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));

// ✅ Preflight global (sin romper path-to-regexp)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

// Healthcheck (Render friendly)
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Fideliza+ Backend" });
});

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);

// Compatibilidad antigua
app.use("/auth", authRoutes);

app.use(errorHandler);
