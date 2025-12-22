import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../db/supabaseAdmin.js";
import { env } from "../config/env.js";

// ✅ Crear client solo cuando se necesita (evita crash al importar)
function getSupabaseAuthClient() {
  if (!env.SUPABASE_ANON_KEY) return null;

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    const supabaseAuth = getSupabaseAuthClient();
    if (!supabaseAuth) {
      // ✅ No botar servidor: solo avisar que falta config
      return res.status(503).json({
        ok: false,
        message: "Login no habilitado: falta SUPABASE_ANON_KEY en backend/.env",
      });
    }

    // 1) Login real contra Supabase Auth
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token; // ✅ NUEVO
    const expiresAt = data.session.expires_at ?? null; // ✅ NUEVO (opcional)
    const authUser = data.user;

    // 2) Perfil desde public.usuarios
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_uid, nombre, email, rol_id, sucursal_id, activo")
      .eq("auth_uid", authUser.id)
      .maybeSingle();

    if (perfilError) throw perfilError;

    // ✅ bloquear login si usuario está inactivo
    // (solo si existe perfil; si no existe, dejamos el comportamiento actual para no romper flujos)
    if (perfil && perfil.activo === false) {
      return res.status(403).json({
        ok: false,
        message: "Tu usuario está inactivo. Contacta al administrador.",
      });
    }

    // 3) Nombre del rol
    let rolNombre = null;
    if (perfil?.rol_id) {
      const { data: rolRow } = await supabaseAdmin
        .from("roles")
        .select("nombre")
        .eq("id", perfil.rol_id)
        .maybeSingle();

      rolNombre = rolRow?.nombre ?? null;
    }

    // ✅ MISMA RESPUESTA DE SIEMPRE + refresh_token
    return res.json({
      ok: true,
      token: accessToken,
      refresh_token: refreshToken, // ✅ NUEVO
      expires_at: expiresAt, // ✅ NUEVO
      user: {
        auth_uid: authUser.id,
        email: authUser.email,
        nombre: perfil?.nombre ?? null,
        rol: rolNombre,
        sucursal_id: perfil?.sucursal_id ?? null,
        perfil_id: perfil?.id ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ✅ NUEVO: renovar access_token usando refresh_token (evita 401 después de un rato)
export async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      return res.status(400).json({ ok: false, message: "Falta refresh_token" });
    }

    const supabaseAuth = getSupabaseAuthClient();
    if (!supabaseAuth) {
      return res.status(503).json({
        ok: false,
        message: "Refresh no habilitado: falta SUPABASE_ANON_KEY en backend/.env",
      });
    }

    const { data, error } = await supabaseAuth.auth.refreshSession({
      refresh_token,
    });

    if (error || !data?.session) {
      return res.status(401).json({
        ok: false,
        message: "No se pudo renovar la sesión. Vuelve a iniciar sesión.",
      });
    }

    return res.json({
      ok: true,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token, // puede rotar
      expires_at: data.session.expires_at ?? null,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}
