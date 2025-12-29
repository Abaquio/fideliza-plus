import { supabaseAdmin } from "../db/supabaseAdmin.js";

export async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: "No autorizado" });
  }

  try {
    // 1) Validar token Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({ ok: false, message: "Token inválido" });
    }

    const authUser = authData.user;

    // 2) Traer perfil COMPLETO (mismo estilo que staff.controller)
    const { data: perfil, error: perfilError } = await supabaseAdmin
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
      .eq("auth_uid", authUser.id)
      .maybeSingle();

    if (perfilError) {
      return res.status(500).json({ ok: false, message: perfilError.message });
    }

    // Si no existe perfil en public.usuarios, bloqueamos (porque el sistema usa esa tabla)
    if (!perfil) {
      return res.status(403).json({
        ok: false,
        message: "Sin permisos (perfil no encontrado en usuarios)",
      });
    }

    // Si está inactivo, bloqueamos
    if (perfil.activo === false) {
      return res.status(403).json({ ok: false, message: "Usuario inactivo" });
    }

    // 3) Dejar req.user COMPLETO para TODO el sistema (permisos + UI)
    req.user = {
      // ids
      auth_uid: perfil.auth_uid,
      perfil_id: perfil.id,

      // datos
      nombre: perfil.nombre ?? null,
      email: perfil.email ?? authUser.email ?? null,
      activo: perfil.activo ?? true,

      // rol
      rol_id: perfil.roles?.id ?? perfil.rol_id ?? null,
      rol: perfil.roles?.nombre ?? null, // <- IMPORTANTE: esto lo usa el check permisos

      // sucursal
      sucursal_id: perfil.sucursales?.id ?? perfil.sucursal_id ?? null,
      sucursal_nombre: perfil.sucursales?.nombre ?? null,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }
}

// alias por compatibilidad (si en algún archivo usan authMiddleware)
export const authMiddleware = auth;
