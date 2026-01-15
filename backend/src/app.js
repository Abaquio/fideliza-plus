import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import descuentosRoutes from "./routes/descuentos.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
import comprasRoutes from "./routes/compras.routes.js"; // ✅ NUEVO
import dashboardRoutes from "./routes/dashboard.routes.js";
import publicRoutes from "./routes/public.routes.js";

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

// ---------------------------------------------------------
// 👇 NUEVA RUTA: El despertador para Render
// ---------------------------------------------------------
app.get("/ping", (req, res) => {
  res.status(200).send("pong 🏓");
});
// ---------------------------------------------------------

// Healthcheck (Render friendly)
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Fideliza+ Backend" });
});

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/descuentos", descuentosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicRoutes);

// ✅ STAFF
app.use("/api/staff", staffRoutes);
app.use("/api/configuracion", configuracionRoutes);

// ✅ COMPRAS (NUEVO)
app.use("/api/compras", comprasRoutes);

// Compatibilidad antigua
app.use("/auth", authRoutes);

app.use(errorHandler);