import { supabaseAdmin } from "../db/supabaseAdmin.js";

/**
 * Lee la configuración global (fila singleton=true).
 * Si no existe, la crea con valores por defecto (seguro para primer arranque).
 */
export async function obtenerConfiguracion(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("configuracion")
      .select(
        "id, singleton, tienda_nombre, tienda_email, tienda_telefono, tienda_web, tienda_descripcion, puntos_por_cada_monto, monto_base_puntos, puntos_bienvenida, actualizado_en"
      )
      .eq("singleton", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const payload = {
        singleton: true,
        tienda_nombre: "Mi Tienda Plus",
        tienda_email: "contacto@mitienda.com",
        tienda_telefono: null,
        tienda_web: null,
        tienda_descripcion: null,
        puntos_por_cada_monto: 1,
        monto_base_puntos: 1000,
        puntos_bienvenida: 100,
      };

      const { data: created, error: createError } = await supabaseAdmin
        .from("configuracion")
        .insert(payload)
        .select(
          "id, singleton, tienda_nombre, tienda_email, tienda_telefono, tienda_web, tienda_descripcion, puntos_por_cada_monto, monto_base_puntos, puntos_bienvenida, actualizado_en"
        )
        .single();

      if (createError) throw createError;

      return res.json({ ok: true, data: created });
    }

    return res.json({ ok: true, data });
  } catch (e) {
    console.error("obtenerConfiguracion error:", e);
    return res.status(500).json({
      ok: false,
      message: "No se pudo obtener la configuración",
    });
  }
}

/**
 * ✅ NUEVO: endpoint seguro (solo lectura) para reglas de cálculo de puntos
 * GET /api/configuracion/puntos
 */
export async function obtenerPuntosConfiguracion(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("configuracion")
      .select("monto_base_puntos, puntos_por_cada_monto")
      .eq("singleton", true)
      .maybeSingle();

    if (error) throw error;

    // defaults seguros si aún no existe la fila
    const payload = {
      monto_base_puntos: Number(data?.monto_base_puntos ?? 1000) || 1000,
      puntos_por_cada_monto: Number(data?.puntos_por_cada_monto ?? 1) || 1,
    };

    return res.json({ ok: true, data: payload });
  } catch (e) {
    console.error("obtenerPuntosConfiguracion error:", e);
    return res.status(500).json({
      ok: false,
      message: "No se pudo obtener la configuración de puntos",
    });
  }
}

/**
 * Actualiza la configuración global (singleton=true).
 */
export async function actualizarConfiguracion(req, res) {
  try {
    const body = req.body || {};

    const tienda_nombre = (body.tienda_nombre ?? "").toString().trim();
    const tienda_email = (body.tienda_email ?? "").toString().trim().toLowerCase();
    const tienda_telefono = (body.tienda_telefono ?? "").toString().trim() || null;
    const tienda_web = (body.tienda_web ?? "").toString().trim() || null;
    const tienda_descripcion = (body.tienda_descripcion ?? "").toString().trim() || null;

    const puntos_por_cada_monto = Number(body.puntos_por_cada_monto);
    const monto_base_puntos = Number(body.monto_base_puntos);
    const puntos_bienvenida = Number(body.puntos_bienvenida);

    if (!tienda_nombre) {
      return res.status(400).json({ ok: false, message: "El nombre de tienda es obligatorio" });
    }
    if (!tienda_email || !tienda_email.includes("@")) {
      return res.status(400).json({ ok: false, message: "Email de contacto inválido" });
    }

    if (!Number.isFinite(puntos_por_cada_monto) || puntos_por_cada_monto < 1) {
      return res.status(400).json({ ok: false, message: "puntos_por_cada_monto debe ser >= 1" });
    }
    if (!Number.isFinite(monto_base_puntos) || monto_base_puntos < 1) {
      return res.status(400).json({ ok: false, message: "monto_base_puntos debe ser >= 1" });
    }
    if (!Number.isFinite(puntos_bienvenida) || puntos_bienvenida < 0) {
      return res.status(400).json({ ok: false, message: "puntos_bienvenida debe ser >= 0" });
    }

    const payload = {
      singleton: true,
      tienda_nombre,
      tienda_email,
      tienda_telefono,
      tienda_web,
      tienda_descripcion,
      puntos_por_cada_monto: Math.floor(puntos_por_cada_monto),
      monto_base_puntos: Math.floor(monto_base_puntos),
      puntos_bienvenida: Math.floor(puntos_bienvenida),
      actualizado_en: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("configuracion")
      .upsert(payload, { onConflict: "singleton" })
      .select(
        "id, singleton, tienda_nombre, tienda_email, tienda_telefono, tienda_web, tienda_descripcion, puntos_por_cada_monto, monto_base_puntos, puntos_bienvenida, actualizado_en"
      )
      .single();

    if (error) throw error;

    return res.json({ ok: true, data });
  } catch (e) {
    console.error("actualizarConfiguracion error:", e);
    return res.status(500).json({
      ok: false,
      message: "No se pudo actualizar la configuración",
    });
  }
}
