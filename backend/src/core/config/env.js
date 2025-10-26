// src/core/config/env.js
import dotenv from "dotenv"
dotenv.config()

// Lista de variables que consideramos críticas para arrancar
const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}. Revisa backend/.env`)
  }
}

export const env = {
  PORT: process.env.PORT || "3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || null,
}