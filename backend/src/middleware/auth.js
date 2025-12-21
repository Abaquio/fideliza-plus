import { supabaseAdmin } from "../db/supabaseAdmin.js";

export async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  try {
    // 1) Validar token Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ ok: false, message: "Token inválido" });
    }

    const u = data.user;

    // 2) Traer perfil desde public.usuarios
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_uid, nombre, email, rol_id, sucursal_id, activo")
      .eq("auth_uid", u.id)
      .maybeSingle();

    if (perfilError) throw perfilError;

    // ✅ NUEVO: bloquear requests si el usuario está inactivo
    if (perfil && perfil.activo === false) {
      return res.status(403).json({
        ok: false,
        message: "Usuario inactivo. Contacta al administrador.",
      });
    }

    // 3) Rol nombre (opcional)
    let rolNombre = null;
    if (perfil?.rol_id) {
      const { data: rolRow } = await supabaseAdmin
        .from("roles")
        .select("nombre")
        .eq("id", perfil.rol_id)
        .maybeSingle();

      rolNombre = rolRow?.nombre ?? null;
    }

    req.user = {
      auth_uid: u.id,
      email: u.email,
      nombre: perfil?.nombre ?? null,
      rol: rolNombre,
      sucursal_id: perfil?.sucursal_id ?? null,
      perfil_id: perfil?.id ?? null,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }
}

// ✅ Alias para que puedas importarlo como authMiddleware sin romper nada
export const authMiddleware = auth;
