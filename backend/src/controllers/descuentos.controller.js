import { supabaseAdmin } from "../db/supabaseAdmin.js";

/**
 * GET /api/descuentos
 * Lista cupones con join a clientes, compras y usuario creador (si existe)
 */
export const listarCupones = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("cupones")
    .select(`
      id,
      codigo,
      tipo_descuento,
      valor,
      costo_puntos,
      estado,
      vence_en,
      compra_id,
      cliente_id,
      usuario_id,
      creado_en,
      clientes:cliente_id ( id, rut, nombres, apellidos ),
      compras:compra_id ( id, monto, fecha_compra ),
      usuarios:usuario_id ( id, nombre, email )
    `)
    .order("creado_en", { ascending: false });

  if (error) return res.status(500).json({ ok: false, message: error.message });
  return res.json({ ok: true, data: data || [] });
};

/**
 * GET /api/descuentos/meta
 * Para poblar selects (clientes)
 */
export const metaDescuentos = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("id, rut, nombres, apellidos, estado")
    .order("creado_en", { ascending: false })
    .limit(500);

  if (error) return res.status(500).json({ ok: false, message: error.message });
  return res.json({ ok: true, clientes: data || [] });
};

/**
 * POST /api/descuentos
 * Crea cupón (cliente_id puede ser null)
 * usuario_id se asigna automático con el usuario logueado
 * costo_puntos: lo define quien crea el cupón
 */
export const crearCupon = async (req, res) => {
  const { codigo, tipo_descuento, valor, costo_puntos, estado, vence_en, cliente_id } = req.body || {};

  if (!codigo || !tipo_descuento || valor === undefined || valor === null || valor === "") {
    return res.status(400).json({ ok: false, message: "Faltan datos obligatorios" });
  }

  // ✅ Nuevo: validar costo_puntos
  const costo = Number(costo_puntos ?? 0);
  if (!Number.isFinite(costo) || costo < 0) {
    return res.status(400).json({ ok: false, message: "Costo en puntos inválido" });
  }

  const createdBy = req.user?.perfil_id ?? null; // staff logueado (public.usuarios.id)

  const payload = {
    codigo: String(codigo).trim(),
    tipo_descuento: String(tipo_descuento).trim(),
    valor: Number(valor),
    costo_puntos: costo,
    estado: estado ? String(estado).trim() : "activo",
    vence_en: vence_en ? new Date(vence_en).toISOString() : null,
    cliente_id: cliente_id || null,
    usuario_id: createdBy,
  };

  const { error } = await supabaseAdmin.from("cupones").insert(payload);

  if (error) return res.status(400).json({ ok: false, message: error.message });
  return res.status(201).json({ ok: true, message: "Cupón creado correctamente" });
};

/**
 * PUT /api/descuentos/:id
 * Actualiza cupón (no tocamos usuario_id aquí para no cambiar autor)
 */
export const actualizarCupon = async (req, res) => {
  const { id } = req.params;
  const { codigo, tipo_descuento, valor, costo_puntos, estado, vence_en, cliente_id } = req.body || {};

  const patch = {};

  if (typeof codigo === "string" && codigo.trim()) patch.codigo = codigo.trim();
  if (typeof tipo_descuento === "string" && tipo_descuento.trim())
    patch.tipo_descuento = tipo_descuento.trim();
  if (valor !== undefined && valor !== null && valor !== "") patch.valor = Number(valor);

  // ✅ Nuevo: permitir editar costo_puntos
  if (costo_puntos !== undefined && costo_puntos !== null && costo_puntos !== "") {
    const costo = Number(costo_puntos);
    if (!Number.isFinite(costo) || costo < 0) {
      return res.status(400).json({ ok: false, message: "Costo en puntos inválido" });
    }
    patch.costo_puntos = costo;
  }

  if (typeof estado === "string" && estado.trim()) patch.estado = estado.trim();
  if (vence_en !== undefined) patch.vence_en = vence_en ? new Date(vence_en).toISOString() : null;
  if (cliente_id !== undefined) patch.cliente_id = cliente_id || null;

  const { error } = await supabaseAdmin.from("cupones").update(patch).eq("id", id);

  if (error) return res.status(400).json({ ok: false, message: error.message });
  return res.json({ ok: true, message: "Cupón actualizado correctamente" });
};

/**
 * DELETE /api/descuentos/:id
 */
export const eliminarCupon = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from("cupones").delete().eq("id", id);

  if (error) return res.status(400).json({ ok: false, message: error.message });
  return res.json({ ok: true, message: "Cupón eliminado correctamente" });
};
