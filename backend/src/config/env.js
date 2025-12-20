import dotenv from "dotenv";
dotenv.config();

const defaultLocal = "http://localhost:5173";

// Permite:
// - CORS_ORIGIN="http://localhost:5173"
// - CORS_ORIGINS="http://localhost:5173,https://tuapp.vercel.app"
const corsOriginsRaw =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  defaultLocal;

// Normaliza: trim + quita "/" final
const normalizeOrigin = (o) => o.replace(/\/$/, "").trim();

const CORS_ORIGINS = corsOriginsRaw
  .split(",")
  .map((s) => normalizeOrigin(s))
  .filter(Boolean);

// (Opcional) permitir previews de Vercel (*.vercel.app)
const ALLOW_VERCEL_PREVIEWS =
  (process.env.CORS_ALLOW_VERCEL_PREVIEWS || "false").toLowerCase() === "true";

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,

  // opcional (login Supabase más adelante)
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || null,

  CORS_ORIGINS,
  ALLOW_VERCEL_PREVIEWS,
};

// ✅ Solo lo estrictamente obligatorio (no rompe local)
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE"];
required.forEach((key) => {
  if (!env[key]) {
    throw new Error(`❌ Falta variable de entorno: ${key}`);
  }
});

// Aviso, no error
if (!env.SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ SUPABASE_ANON_KEY no configurada (login Supabase aún no habilitado)."
  );
}
