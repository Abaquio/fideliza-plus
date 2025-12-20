import { supabaseAdmin } from "../db/supabaseAdmin.js";

/**
 * GET /staff
 */
export const listarStaff = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select(`
      id,
      nombre,
      email,
      activo,
      roles:rol_id ( nombre ),
      sucursales:sucursal_id ( nombre )
    `)
    .order("creado_en", { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }

  res.json({ ok: true, data });
};

/**
 * POST /staff
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
      nombre,
      email,
      rol_id,
      sucursal_id,
      activo: true,
    });

  if (dbError) {
    return res.status(500).json({ ok: false, message: dbError.message });
  }

  res.status(201).json({ ok: true, message: "Usuario creado correctamente" });
};

/**
 * PUT /staff/:id/estado
 */
export const cambiarEstadoStaff = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  const { error } = await supabaseAdmin
    .from("usuarios")
    .update({ activo })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }

  res.json({ ok: true });
};
