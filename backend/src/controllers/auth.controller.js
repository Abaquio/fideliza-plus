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
    const refreshToken = data.session.refresh_token;
    const expiresAt = data.session.expires_at ?? null;
    const authUser = data.user;

    // 2) Perfil desde public.usuarios
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_uid, nombre, email, rol_id, sucursal_id, activo")
      .eq("auth_uid", authUser.id)
      .maybeSingle();

    if (perfilError) throw perfilError;

    // bloquear login si usuario está inactivo
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

    return res.json({
      ok: true,
      token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
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

// ✅ renovar access_token usando refresh_token
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
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at ?? null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * ✅ CORREGIDO: GET /api/auth/me
 * En vez de devolver req.user (que a veces viene incompleto),
 * devolvemos el perfil completo (igual que Staff) usando auth_uid.
 */
export async function me(req, res, next) {
  try {
    const authUid = req.user?.auth_uid;

    if (!authUid) {
      return res.status(401).json({ ok: false, message: "No autorizado" });
    }

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select(
        `
        id,
        auth_uid,
        nombre,
        email,
        activo,
        rol_id,
        sucursal_id,
        roles:rol_id ( id, nombre ),
        sucursales:sucursal_id ( id, nombre )
      `
      )
      .eq("auth_uid", authUid)
      .maybeSingle();

    if (error) return res.status(500).json({ ok: false, message: error.message });
    if (!data) return res.status(404).json({ ok: false, message: "Perfil no encontrado" });

    // Si está inactivo, puedes bloquear también acá (opcional, consistente con login)
    if (data.activo === false) {
      return res.status(403).json({ ok: false, message: "Usuario inactivo" });
    }

    return res.json({
      ok: true,
      user: {
        auth_uid: data.auth_uid,
        email: data.email ?? null,
        nombre: data.nombre ?? null,
        rol: data.roles?.nombre ?? null,
        rol_id: data.roles?.id ?? data.rol_id ?? null,
        sucursal_id: data.sucursal_id ?? null,
        sucursal_nombre: data.sucursales?.nombre ?? null,
        perfil_id: data.id,
        activo: data.activo ?? true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * ✅ NUEVO: PUT /api/auth/me
 * Edita tu propio perfil (nombre y/o email)
 * - nombre: solo tabla public.usuarios
 * - email: actualiza Supabase Auth + tabla public.usuarios
 */
export async function updateMe(req, res, next) {
  try {
    const { nombre, email } = req.body || {};

    if (!req.user?.perfil_id || !req.user?.auth_uid) {
      return res.status(401).json({ ok: false, message: "No autorizado" });
    }

    // Validaciones simples (sin romper nada)
    if (typeof nombre !== "undefined" && typeof nombre !== "string") {
      return res.status(400).json({ ok: false, message: "Nombre inválido" });
    }
    if (typeof email !== "undefined" && typeof email !== "string") {
      return res.status(400).json({ ok: false, message: "Email inválido" });
    }

    const patchUsuarios = {};
    const patchAuth = {};

    if (typeof nombre === "string") patchUsuarios.nombre = nombre.trim() || null;

    if (typeof email === "string" && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      patchUsuarios.email = cleanEmail;
      patchAuth.email = cleanEmail;
      patchAuth.email_confirm = true; // evita confirmaciones raras
    }

    if (Object.keys(patchUsuarios).length === 0 && Object.keys(patchAuth).length === 0) {
      return res.json({ ok: true, message: "Sin cambios" });
    }

    // 1) Si viene email, actualizar en Supabase Auth
    if (Object.keys(patchAuth).length > 0) {
      const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(
        req.user.auth_uid,
        patchAuth
      );
      if (aErr) return res.status(400).json({ ok: false, message: aErr.message });
    }

    // 2) Actualizar tabla public.usuarios
    if (Object.keys(patchUsuarios).length > 0) {
      const { error: dbErr } = await supabaseAdmin
        .from("usuarios")
        .update(patchUsuarios)
        .eq("id", req.user.perfil_id);

      if (dbErr) return res.status(500).json({ ok: false, message: dbErr.message });
    }

    // 3) Traer perfil actualizado + rol/sucursal nombre (para refrescar UI)
    const { data: perfil, error: pErr } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_uid, nombre, email, rol_id, sucursal_id, activo")
      .eq("id", req.user.perfil_id)
      .maybeSingle();

    if (pErr) return res.status(500).json({ ok: false, message: pErr.message });

    let rolNombre = null;
    if (perfil?.rol_id) {
      const { data: rolRow } = await supabaseAdmin
        .from("roles")
        .select("nombre")
        .eq("id", perfil.rol_id)
        .maybeSingle();
      rolNombre = rolRow?.nombre ?? null;
    }

    let sucursalNombre = null;
    if (perfil?.sucursal_id) {
      const { data: sucRow } = await supabaseAdmin
        .from("sucursales")
        .select("nombre")
        .eq("id", perfil.sucursal_id)
        .maybeSingle();
      sucursalNombre = sucRow?.nombre ?? null;
    }

    return res.json({
      ok: true,
      message: "Perfil actualizado",
      user: {
        auth_uid: perfil?.auth_uid ?? req.user.auth_uid,
        email: perfil?.email ?? req.user.email,
        nombre: perfil?.nombre ?? req.user.nombre,
        rol: rolNombre ?? req.user.rol,
        sucursal_id: perfil?.sucursal_id ?? req.user.sucursal_id,
        sucursal_nombre: sucursalNombre,
        perfil_id: perfil?.id ?? req.user.perfil_id,
        activo: perfil?.activo ?? true,
      },
    });
  } catch (err) {
    next(err);
  }
}
