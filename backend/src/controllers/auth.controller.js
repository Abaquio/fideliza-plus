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
    const authUser = data.user;

    // 2) Perfil desde public.usuarios
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_uid, nombre, email, rol_id, sucursal_id, activo")
      .eq("auth_uid", authUser.id)
      .maybeSingle();

    if (perfilError) throw perfilError;

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

export async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}
