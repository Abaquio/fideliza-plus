import { supabaseAdmin } from "../db/supabaseAdmin.js";

/**
 * GET /api/staff
 */
export const listarStaff = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select(`
      id,
      auth_uid,
      nombre,
      email,
      activo,
      roles:rol_id ( id, nombre ),
      sucursales:sucursal_id ( id, nombre )
    `)
    .order("creado_en", { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }

  res.json({ ok: true, data });
};

/**
 * GET /api/staff/meta
 * Devuelve roles + sucursales para poblar selects
 */
export const metaStaff = async (req, res) => {
  const [{ data: roles, error: e1 }, { data: sucursales, error: e2 }] = await Promise.all([
    supabaseAdmin.from("roles").select("id, nombre").order("nombre", { ascending: true }),
    supabaseAdmin.from("sucursales").select("id, nombre, activo").order("nombre", { ascending: true }),
  ]);

  if (e1) return res.status(500).json({ ok: false, message: e1.message });
  if (e2) return res.status(500).json({ ok: false, message: e2.message });

  return res.json({ ok: true, roles: roles || [], sucursales: sucursales || [] });
};

/**
 * POST /api/staff
 */
export const crearStaff = async (req, res) => {
  const { nombre, email, password, rol_id, sucursal_id } = req.body;

  if (!email || !password || !rol_id) {
    return res.status(400).json({
      ok: false,
      message: "Faltan datos obligatorios",
    });
  }

  // 1️⃣ Crear usuario en Supabase Auth
  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return res.status(400).json({ ok: false, message: authError.message });
  }

  // 2️⃣ Crear registro en tabla usuarios
  const { error: dbError } = await supabaseAdmin
    .from("usuarios")
    .insert({
      auth_uid: authUser.user.id,
      nombre: nombre || null,
      email,
      rol_id,
      sucursal_id: sucursal_id || null,
      activo: true,
    });

  if (dbError) {
    return res.status(500).json({ ok: false, message: dbError.message });
  }

  res.status(201).json({ ok: true, message: "Usuario creado correctamente" });
};

/**
 * PUT /api/staff/:id
 * Edita: nombre, email, rol_id, sucursal_id, activo
 * Password es opcional: si viene y no está vacía => se actualiza
 */
export const actualizarStaff = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol_id, sucursal_id, activo } = req.body;

  // 1) Buscar usuario actual para obtener auth_uid
  const { data: usuario, error: uErr } = await supabaseAdmin
    .from("usuarios")
    .select("id, auth_uid, email")
    .eq("id", id)
    .maybeSingle();

  if (uErr) return res.status(500).json({ ok: false, message: uErr.message });
  if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

  // 2) Actualizar Supabase Auth (email / password)
  // Solo si vienen valores
  const authPatch = {};
  if (typeof email === "string" && email.trim()) authPatch.email = email.trim();
  if (typeof password === "string" && password.trim()) authPatch.password = password;

  if (Object.keys(authPatch).length > 0) {
    // para evitar confirmaciones extra
    authPatch.email_confirm = true;

    const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.auth_uid,
      authPatch
    );
    if (aErr) return res.status(400).json({ ok: false, message: aErr.message });
  }

  // 3) Actualizar tabla public.usuarios
  const dbPatch = {};
  if (typeof nombre !== "undefined") dbPatch.nombre = nombre || null;
  if (typeof email === "string" && email.trim()) dbPatch.email = email.trim();
  if (typeof rol_id !== "undefined") dbPatch.rol_id = rol_id;
  if (typeof sucursal_id !== "undefined") dbPatch.sucursal_id = sucursal_id || null;
  if (typeof activo !== "undefined") dbPatch.activo = !!activo;

  const { error: dbErr } = await supabaseAdmin.from("usuarios").update(dbPatch).eq("id", id);
  if (dbErr) return res.status(500).json({ ok: false, message: dbErr.message });

  return res.json({ ok: true, message: "Usuario actualizado correctamente" });
};

/**
 * POST /api/staff/:id/reset-password
 * Envía correo de recuperación a ese usuario (opción "por correo")
 */
export const enviarResetPassword = async (req, res) => {
  const { id } = req.params;

  const { data: usuario, error: uErr } = await supabaseAdmin
    .from("usuarios")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (uErr) return res.status(500).json({ ok: false, message: uErr.message });
  if (!usuario?.email) return res.status(404).json({ ok: false, message: "Email no encontrado" });

  const email = usuario.email;

  // Intento 1: generateLink (admin) si existe
  try {
    if (supabaseAdmin?.auth?.admin?.generateLink) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          // Puedes ajustar esto a tu URL real de front
          redirectTo: "http://localhost:5173",
        },
      });

      if (error) return res.status(400).json({ ok: false, message: error.message });
      return res.json({ ok: true, message: "Correo de recuperación generado", data });
    }
  } catch (e) {
    // sigue al fallback
  }

  // Fallback: resetPasswordForEmail (si está disponible)
  try {
    if (supabaseAdmin?.auth?.resetPasswordForEmail) {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173",
      });

      if (error) return res.status(400).json({ ok: false, message: error.message });
      return res.json({ ok: true, message: "Correo de recuperación enviado" });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, message: "No se pudo enviar el correo de recuperación" });
  }

  return res.status(500).json({
    ok: false,
    message: "SDK no soporta envío de recovery en este entorno (update password funciona igual)",
  });
};

/**
 * PUT /api/staff/:id/estado
 */
export const cambiarEstadoStaff = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  const { error } = await supabaseAdmin
    .from("usuarios")
    .update({ activo: !!activo })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }

  res.json({ ok: true });
};
