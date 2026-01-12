import { supabaseAdmin } from "../db/supabaseAdmin.js";

function toISO(d) {
  try {
    return d ? new Date(d).toISOString() : null;
  } catch {
    return null;
  }
}

function parseNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

async function getConfigPuntos() {
  const { data, error } = await supabaseAdmin
    .from("configuracion")
    .select("monto_base_puntos, puntos_por_cada_monto")
    .eq("singleton", true)
    .maybeSingle();

  if (error) {
    return { monto_base_puntos: 1000, puntos_por_cada_monto: 1 };
  }

  return {
    monto_base_puntos: Number(data?.monto_base_puntos ?? 1000) || 1000,
    puntos_por_cada_monto: Number(data?.puntos_por_cada_monto ?? 1) || 1,
  };
}

function calcularPuntos(monto, config) {
  const base = Number(config?.monto_base_puntos ?? 1000) || 1000;
  const porCada = Number(config?.puntos_por_cada_monto ?? 1) || 1;
  const m = Number(monto || 0);

  if (!Number.isFinite(m) || m <= 0) return 0;
  if (base <= 0) return 0;

  return Math.floor(m / base) * porCada;
}

async function getPuntosActualesCliente(clienteId) {
  const { data, error } = await supabaseAdmin
    .from("puntos_movimientos")
    .select("puntos")
    .eq("cliente_id", clienteId);

  if (error) return 0;
  return (data || []).reduce((acc, r) => acc + Number(r.puntos || 0), 0);
}

/**
 * GET /api/compras
 * Lista compras con puntos_ganados calculado desde puntos_movimientos (tipo=ganado)
 */
export const listarCompras = async (req, res) => {
  const { estado, sucursal_id, usuario_id, cliente_id, desde, hasta } = req.query || {};

  let q = supabaseAdmin
    .from("compras")
    .select(
      `
      id,
      cliente_id,
      usuario_id,
      sucursal_id,
      monto,
      fecha_compra,
      estado,
      numero_folio,
      creado_en,
      clientes:cliente_id ( id, rut, nombres, apellidos, email, telefono, estado ),
      usuarios:usuario_id ( id, nombre, email ),
      sucursales:sucursal_id ( id, nombre )
    `
    )
    .order("fecha_compra", { ascending: false });

  if (estado) q = q.eq("estado", estado);
  if (sucursal_id) q = q.eq("sucursal_id", sucursal_id);
  if (usuario_id) q = q.eq("usuario_id", usuario_id);
  if (cliente_id) q = q.eq("cliente_id", cliente_id);

  if (desde) q = q.gte("fecha_compra", toISO(`${desde}T00:00:00`) || toISO(desde));
  if (hasta) q = q.lte("fecha_compra", toISO(`${hasta}T23:59:59`) || toISO(hasta));

  const { data, error } = await q;
  if (error) return res.status(500).json({ ok: false, message: error.message });

  const rows = data || [];
  const compraIds = rows.map((r) => r.id).filter(Boolean);

  let puntosMap = new Map();
  if (compraIds.length) {
    const { data: movs } = await supabaseAdmin
      .from("puntos_movimientos")
      .select("compra_id, puntos, tipo")
      .in("compra_id", compraIds)
      .eq("tipo", "ganado");

    for (const m of movs || []) {
      puntosMap.set(m.compra_id, Number(m.puntos || 0));
    }
  }

  const enriched = rows.map((r) => ({
    ...r,
    puntos_ganados: puntosMap.get(r.id) || 0,
  }));

  return res.json({ ok: true, data: enriched });
};

export const metaCompras = async (req, res) => {
  const { data: clientes, error: e1 } = await supabaseAdmin
    .from("clientes")
    .select("id, rut, nombres, apellidos, estado")
    .order("creado_en", { ascending: false })
    .limit(1000);

  if (e1) return res.status(500).json({ ok: false, message: e1.message });

  const { data: sucursales, error: e2 } = await supabaseAdmin
    .from("sucursales")
    .select("id, nombre, activo")
    .order("nombre", { ascending: true });

  if (e2) return res.status(500).json({ ok: false, message: e2.message });

  return res.json({
    ok: true,
    clientes: clientes || [],
    sucursales: sucursales || [],
  });
};

/**
 * GET /api/compras/ajustes
 * ✅ Ahora lista movimientos tipo=ajuste y tipo=canje (para "Movimientos")
 */
export const listarAjustes = async (req, res) => {
  const { desde, hasta, cliente_id, usuario_id } = req.query || {};

  let q = supabaseAdmin
    .from("puntos_movimientos")
    .select(
      `
      id,
      cliente_id,
      compra_id,
      tipo,
      puntos,
      usuario_id,
      creado_en,
      cupon_id,
      cupon_codigo,
      clientes:cliente_id ( id, rut, nombres, apellidos ),
      usuarios:usuario_id ( id, nombre, email ),
      cupones:cupon_id ( id, codigo, tipo_descuento, valor, costo_puntos, estado )
    `
    )
    .in("tipo", ["ajuste", "canje"])
    .order("creado_en", { ascending: false });

  if (cliente_id) q = q.eq("cliente_id", cliente_id);
  if (usuario_id) q = q.eq("usuario_id", usuario_id);
  if (desde) q = q.gte("creado_en", toISO(`${desde}T00:00:00`) || toISO(desde));
  if (hasta) q = q.lte("creado_en", toISO(`${hasta}T23:59:59`) || toISO(hasta));

  const { data, error } = await q;
  if (error) return res.status(500).json({ ok: false, message: error.message });

  return res.json({ ok: true, data: data || [] });
};

/**
 * POST /api/compras/movimientos
 * ✅ Crea movimiento en puntos_movimientos (ajuste / canje)
 * - usuario_id viene del token (req.user.perfil_id)
 * - valida consistencia cupon_id según tipo
 * - evita dejar al cliente con puntos negativos
 */
export const crearMovimiento = async (req, res) => {
  const { cliente_id, tipo, puntos, cupon_id, cupon_codigo } = req.body || {};

  if (!cliente_id) return res.status(400).json({ ok: false, message: "cliente_id es obligatorio" });

  const tipoFinal = String(tipo || "").trim().toLowerCase();
  const tiposValidos = ["ganado", "ajuste", "reversa", "bienvenida", "canje"];
  if (!tiposValidos.includes(tipoFinal)) {
    return res.status(400).json({ ok: false, message: "Tipo inválido" });
  }

  const usuarioId = req.user?.perfil_id ?? null;
  if (!usuarioId) return res.status(401).json({ ok: false, message: "No autorizado (sin perfil)" });

  // Solo permitimos crear desde UI: ajuste y canje (por ahora)
  if (!["ajuste", "canje"].includes(tipoFinal)) {
    return res.status(400).json({ ok: false, message: "Solo se permite crear ajuste o canje desde esta acción" });
  }

  // puntos
  let puntosFinal = parseNumber(puntos, NaN);
  if (!Number.isFinite(puntosFinal) || !Number.isInteger(puntosFinal)) {
    return res.status(400).json({ ok: false, message: "Puntos inválidos (entero)" });
  }

  // Reglas por tipo
  if (tipoFinal === "ajuste") {
    if (puntosFinal === 0) {
      return res.status(400).json({ ok: false, message: "El ajuste no puede ser 0" });
    }
    // consistencia cupon
    if (cupon_id) return res.status(400).json({ ok: false, message: "cupon_id debe ser null si no es canje" });
    if (cupon_codigo) return res.status(400).json({ ok: false, message: "cupon_codigo debe ser null si no es canje" });
  }

  if (tipoFinal === "canje") {
    if (!cupon_id) return res.status(400).json({ ok: false, message: "cupon_id es obligatorio para canje" });

    // obtén cupón y valida costo
    const { data: cup, error: cupErr } = await supabaseAdmin
      .from("cupones")
      .select("id, codigo, costo_puntos, estado")
      .eq("id", cupon_id)
      .maybeSingle();

    if (cupErr) return res.status(400).json({ ok: false, message: cupErr.message });
    if (!cup?.id) return res.status(404).json({ ok: false, message: "Cupón no encontrado" });

    const costo = Number(cup.costo_puntos || 0);
    const costoInt = Number.isFinite(costo) ? Math.max(0, Math.trunc(costo)) : 0;
    if (costoInt <= 0) {
      return res.status(400).json({ ok: false, message: "Cupón con costo inválido" });
    }

    // Forzamos puntos a ser negativo (canje descuenta)
    puntosFinal = -Math.abs(costoInt);

    // snapshot del código
    const snapshot = String(cupon_codigo || cup.codigo || "").trim() || null;
    if (!snapshot) return res.status(400).json({ ok: false, message: "No se pudo obtener cupon_codigo" });

    // OK, lo asignamos abajo en payload
  }

  // evitar puntos negativos finales
  const puntosActuales = await getPuntosActualesCliente(cliente_id);
  const puntosResultado = puntosActuales + puntosFinal;
  if (puntosResultado < 0) {
    return res.status(400).json({
      ok: false,
      message: "La operación dejaría al cliente con puntos negativos",
    });
  }

  // payload DB
  const insert = {
    cliente_id,
    compra_id: null,
    tipo: tipoFinal,
    puntos: puntosFinal,
    usuario_id: usuarioId,
    // creado_en default now()
    cupon_id: tipoFinal === "canje" ? cupon_id : null,
    cupon_codigo:
      tipoFinal === "canje" ? String(cupon_codigo || "").trim() || null : null,
  };

  // Si canje y no viene cupon_codigo, intenta setearlo desde DB
  if (tipoFinal === "canje" && !insert.cupon_codigo) {
    const { data: cup2 } = await supabaseAdmin.from("cupones").select("codigo").eq("id", cupon_id).maybeSingle();
    insert.cupon_codigo = String(cup2?.codigo || "").trim() || null;
  }

  const { data, error } = await supabaseAdmin
    .from("puntos_movimientos")
    .insert(insert)
    .select(
      `
      id,
      cliente_id,
      compra_id,
      tipo,
      puntos,
      usuario_id,
      creado_en,
      cupon_id,
      cupon_codigo
    `
    )
    .maybeSingle();

  if (error) return res.status(400).json({ ok: false, message: error.message });

  return res.status(201).json({
    ok: true,
    message: "Movimiento registrado correctamente",
    data,
  });
};

/**
 * POST /api/compras
 * (sin cambios)
 */
export const crearCompra = async (req, res) => {
  const { cliente_id, sucursal_id, monto, estado, fecha_compra, numero_folio } = req.body || {};

  if (!cliente_id) return res.status(400).json({ ok: false, message: "cliente_id es obligatorio" });

  const montoNum = parseNumber(monto, NaN);
  if (!Number.isFinite(montoNum) || montoNum < 0) {
    return res.status(400).json({ ok: false, message: "Monto inválido" });
  }

  const vendedorId = req.user?.perfil_id ?? null;
  if (!vendedorId) return res.status(401).json({ ok: false, message: "No autorizado (sin perfil)" });

  const estadoFinal = (estado ? String(estado).trim().toLowerCase() : "vigente");
  if (!["vigente", "anulada"].includes(estadoFinal)) {
    return res.status(400).json({ ok: false, message: "Estado inválido (vigente/anulada)" });
  }

  const payload = {
    cliente_id,
    usuario_id: vendedorId,
    sucursal_id: sucursal_id || req.user?.sucursal_id || null,
    monto: montoNum,
    estado: estadoFinal,
    fecha_compra: fecha_compra ? toISO(fecha_compra) : new Date().toISOString(),
    numero_folio: numero_folio ? String(numero_folio).trim() : null,
  };

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("compras")
    .insert(payload)
    .select("id, cliente_id, monto, estado, usuario_id, sucursal_id, fecha_compra, numero_folio, creado_en")
    .maybeSingle();

  if (insertErr) return res.status(400).json({ ok: false, message: insertErr.message });
  if (!inserted?.id) return res.status(500).json({ ok: false, message: "No se pudo crear la compra" });

  if (estadoFinal === "vigente") {
    const cfg = await getConfigPuntos();
    const puntos = calcularPuntos(inserted.monto, cfg);

    if (puntos > 0) {
      const mov = {
        cliente_id: inserted.cliente_id,
        compra_id: inserted.id,
        tipo: "ganado",
        puntos,
        usuario_id: vendedorId,
      };

      const { error: movErr } = await supabaseAdmin.from("puntos_movimientos").insert(mov);

      if (movErr) {
        await supabaseAdmin.from("compras").delete().eq("id", inserted.id);
        return res.status(400).json({
          ok: false,
          message: `No se pudo registrar puntos: ${movErr.message}`,
        });
      }
    }
  }

  return res.status(201).json({ ok: true, message: "Compra registrada correctamente", data: inserted });
};

/**
 * PUT /api/compras/:id (sin cambios)
 */
export const actualizarCompra = async (req, res) => {
  const { id } = req.params;
  const { cliente_id, sucursal_id, monto, estado, fecha_compra, numero_folio } = req.body || {};

  const patch = {};

  if (cliente_id !== undefined) patch.cliente_id = cliente_id || null;
  if (sucursal_id !== undefined) patch.sucursal_id = sucursal_id || null;

  if (monto !== undefined && monto !== null && monto !== "") {
    const montoNum = parseNumber(monto, NaN);
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      return res.status(400).json({ ok: false, message: "Monto inválido" });
    }
    patch.monto = montoNum;
  }

  if (estado !== undefined) {
    const e = estado ? String(estado).trim().toLowerCase() : null;
    if (e && !["vigente", "anulada"].includes(e)) {
      return res.status(400).json({ ok: false, message: "Estado inválido (vigente/anulada)" });
    }
    patch.estado = e;
  }

  if (fecha_compra !== undefined) patch.fecha_compra = fecha_compra ? toISO(fecha_compra) : null;
  if (numero_folio !== undefined) patch.numero_folio = numero_folio ? String(numero_folio).trim() : null;

  const { data: updated, error } = await supabaseAdmin
    .from("compras")
    .update(patch)
    .eq("id", id)
    .select("id, cliente_id, monto, estado, usuario_id, sucursal_id, fecha_compra, numero_folio, creado_en")
    .maybeSingle();

  if (error) return res.status(400).json({ ok: false, message: error.message });
  if (!updated?.id) return res.status(404).json({ ok: false, message: "Compra no encontrada" });

  const estadoFinal = String(updated.estado || "").toLowerCase();

  if (estadoFinal === "anulada") {
    await supabaseAdmin
      .from("puntos_movimientos")
      .delete()
      .eq("compra_id", updated.id)
      .eq("tipo", "ganado");

    return res.json({ ok: true, message: "Compra actualizada correctamente", data: updated });
  }

  if (estadoFinal === "vigente") {
    const cfg = await getConfigPuntos();
    const puntos = calcularPuntos(updated.monto, cfg);

    const { data: movExist } = await supabaseAdmin
      .from("puntos_movimientos")
      .select("id")
      .eq("compra_id", updated.id)
      .eq("tipo", "ganado")
      .maybeSingle();

    if (movExist?.id) {
      await supabaseAdmin.from("puntos_movimientos").update({ puntos }).eq("id", movExist.id);
    } else if (puntos > 0) {
      await supabaseAdmin.from("puntos_movimientos").insert({
        cliente_id: updated.cliente_id,
        compra_id: updated.id,
        tipo: "ganado",
        puntos,
        usuario_id: updated.usuario_id || null,
      });
    }
  }

  return res.json({ ok: true, message: "Compra actualizada correctamente", data: updated });
};

/**
 * DELETE /api/compras/:id (sin cambios)
 */
export const eliminarCompra = async (req, res) => {
  const { id } = req.params;

  await supabaseAdmin.from("puntos_movimientos").delete().eq("compra_id", id);

  const { error } = await supabaseAdmin.from("compras").delete().eq("id", id);

  if (error) return res.status(400).json({ ok: false, message: error.message });
  return res.json({ ok: true, message: "Compra eliminada correctamente" });
};
