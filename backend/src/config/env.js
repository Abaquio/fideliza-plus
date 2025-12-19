import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,

  // ✅ opcional por ahora (cuando activemos login real, la agregas)
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || null,

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
};

// ✅ Solo exigimos lo que hoy tu backend realmente usa sí o sí
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE"];
required.forEach((key) => {
  if (!env[key]) {
    throw new Error(`❌ Falta variable de entorno: ${key}`);
  }
});

// Aviso amigable (no rompe)
if (!env.SUPABASE_ANON_KEY) {
  console.warn("⚠️ SUPABASE_ANON_KEY no está configurada (login Supabase aún no habilitado).");
}
