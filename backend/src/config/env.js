import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173"
};

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE", "JWT_SECRET"];
required.forEach((key) => {
  if (!env[key]) {
    throw new Error(`❌ Falta variable de entorno: ${key}`);
  }
});
