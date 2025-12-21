import { supabaseAdmin } from "../db/supabaseAdmin.js";
import { validarYNormalizarRut } from "../utils/rut.js";
import * as XLSX from "xlsx";

/* -----------------------------
   Helpers: Fuente embebida
------------------------------ */
function pickFuenteEmbed(row) {
  const f = row?.fuentes_clientes;
  if (!f) return null;
  return Array.isArray(f) ? (f[0] || null) : f;
}

function mapClienteRow(row) {
  const fuente = pickFuenteEmbed(row);
  return {
    ...row,
    fuente_id: row?.fuente_id ?? null,
    fuente_nombre: fuente?.nombre ?? null,
    fuente: fuente
      ? { id: fuente.id ?? null, nombre: fuente.nombre ?? null, tipo: fuente.tipo ?? null }
      : null,
    // Se recalculan más abajo (no rompe el shape del front)
    puntos_total: 0,
    compras_total: 0,
  };
}

/* -----------------------------
   Helpers: Configuración & Puntos
------------------------------ */
async function getConfiguracionSingleton() {
  // ✅ select mínimo y seguro (evita fallos por columnas/typos)
  const { data, error } = await supabaseAdmin
    .from("configuracion")
    .select("id, singleton, puntos_bienvenida")
    .eq("singleton", true)
    .limit(1);

  if (error) {
    console.warn("[configuracion] Error leyendo singleton:", error?.message || error);
    return null;
  }

  return data?.[0] ?? null;
}

async function otorgarPuntosBienvenida({ clienteId, usuarioId }) {
  try {
    const cfg = await getConfiguracionSingleton();
    const puntos = Number(cfg?.puntos_bienvenida ?? 0);

    if (!Number.isFinite(puntos) || puntos <= 0) return;

    const { error } = await supabaseAdmin.from("puntos_movimientos").insert({
      cliente_id: clienteId,
      compra_id: null,
      tipo: "bienvenida", // ✅ ahora permitido por tu CHECK
      puntos,
      usuario_id: usuarioId ?? null,
    });

    if (error) {
      console.warn("[puntos_bienvenida] Insert falló:", error?.message || error);
    }
  } catch (e) {
    console.warn("[puntos_bienvenida] Error inesperado:", e?.message || e);
  }
}

async function calcularPuntosTotalesPorClientes(clienteIds = []) {
  if (!clienteIds.length) return new Map();

  const { data, error } = await supabaseAdmin
    .from("puntos_movimientos")
    .select("cliente_id, puntos")
    .in("cliente_id", clienteIds);

  if (error) {
    console.warn("[puntos_total] No se pudo leer puntos_movimientos:", error?.message || error);
    return new Map();
  }

  const totals = new Map();
  for (const row of data || []) {
    const id = row.cliente_id;
    const p = Number(row.puntos || 0);
    totals.set(id, (totals.get(id) || 0) + (Number.isFinite(p) ? p : 0));
  }
  return totals;
}

/* -----------------------------
   ✅ Fuente por defecto "Medical Season"
   (solo se usa si el POST no trae fuente_id)
------------------------------ */
async function getFuenteIdMedicalSeason() {
  try {
    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .select("id, nombre, activo")
      .ilike("nombre", "medical season")
      .eq("activo", true)
      .limit(1);

    if (error) {
      console.warn("[fuentes_clientes] Error buscando Medical Season:", error?.message || error);
      return null;
    }

    return data?.[0]?.id ?? null;
  } catch (e) {
    console.warn("[fuentes_clientes] Error inesperado:", e?.message || e);
    return null;
  }
}

/* -----------------------------
   Helpers: Drive/Sheets import
------------------------------ */
function extractDriveFileId(url = "") {
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];

  const m2 = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];

  const m3 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return m3[1];

  return null;
}

function toDirectDriveDownload(url) {
  if (!url) return null;

  if (url.includes("docs.google.com/spreadsheets/")) {
    const id = extractDriveFileId(url);
    if (!id) return null;
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  }

  if (url.includes("drive.google.com/file/")) {
    const id = extractDriveFileId(url);
    if (!id) return null;
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  if (url.includes("drive.google.com/uc")) return url;
  if (url.includes("export=download") && url.includes("id=")) return url;

  if (url.includes("drive.google.com/open")) {
    const id = extractDriveFileId(url);
    if (!id) return null;
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  return null;
}

async function fetchXlsxFromDrive(driveUrl) {
  const direct = toDirectDriveDownload(driveUrl);
  if (!direct) {
    const err = new Error("No se pudo interpretar el link de Drive/Sheets");
    err.statusCode = 400;
    throw err;
  }

  const resp = await fetch(direct, { redirect: "follow" });
  if (!resp.ok) {
    const err = new Error(
      "No se pudo descargar el archivo. Verifica que sea 'Cualquiera con el enlace puede ver'."
    );
    err.statusCode = 400;
    throw err;
  }

  const ab = await resp.arrayBuffer();
  return Buffer.from(ab);
}

function parseClientesFromWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  return (rows || []).map((r) => ({
    rut: String(r.rut || r.RUT || "").trim(),
    nombres: String(r.nombres || r.Nombres || "").trim(),
    apellidos: String(r.apellidos || r.Apellidos || "").trim(),
    email: String(r.email || r.Email || "").trim(),
    telefono: String(r.telefono || r.Telefono || "").trim(),
  }));
}

function normalizeEstrategia(value) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "reemplazar") return "reemplazar";
  if (v === "omitir") return "omitir";
  return null;
}

/* -----------------------------
   CRUD Clientes
------------------------------ */
export async function listarClientes(req, res, next) {
  try {
    const search = (req.query.search || "").trim();

    let query = supabaseAdmin
      .from("clientes")
      .select(`
        id,
        rut,
        nombres,
        apellidos,
        telefono,
        email,
        estado,
        creado_en,
        fuente_id,
        fuentes_clientes ( id, nombre, tipo )
      `)
      .order("creado_en", { ascending: false })
      .limit(100);

    if (search) {
      query = query.or(
        [
          `rut.ilike.%${search}%`,
          `nombres.ilike.%${search}%`,
          `apellidos.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `telefono.ilike.%${search}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const base = (data || []).map((c) => mapClienteRow(c));
    const ids = base.map((c) => c.id).filter(Boolean);

    // ✅ puntos_total real (batch)
    const totalsMap = await calcularPuntosTotalesPorClientes(ids);

    const clientes = base.map((c) => ({
      ...c,
      puntos_total: totalsMap.get(c.id) || 0,
    }));

    res.json({ ok: true, clientes });
  } catch (err) {
    next(err);
  }
}

export async function crearCliente(req, res, next) {
  try {
    // ✅ aceptamos fuente_id opcional
    const { rut, nombres, apellidos, email, telefono, fuente_id } = req.body || {};

    const rutNormalizado = validarYNormalizarRut(rut);
    if (!nombres?.trim()) {
      return res.status(400).json({ ok: false, message: "El nombre es obligatorio" });
    }

    // ✅ si no viene fuente_id, usamos Medical Season (si existe)
    let fuenteIdFinal = fuente_id ?? null;
    if (!fuenteIdFinal) {
      fuenteIdFinal = await getFuenteIdMedicalSeason();
    }

    const payload = {
      rut: rutNormalizado,
      nombres: nombres.trim(),
      apellidos: apellidos ? apellidos.trim() : null,
      email: email ? email.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      estado: "activo",
      fuente_id: fuenteIdFinal,
    };

    const { data, error } = await supabaseAdmin
      .from("clientes")
      .insert(payload)
      .select(`
        id,
        rut,
        nombres,
        apellidos,
        telefono,
        email,
        estado,
        creado_en,
        fuente_id,
        fuentes_clientes ( id, nombre, tipo )
      `);

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ ok: false, message: "El RUT ya existe" });
      }
      throw error;
    }

    const inserted = Array.isArray(data) ? data[0] : data;
    const clienteId = inserted?.id;

    // ✅ Puntos de bienvenida al crear cliente
    if (clienteId) {
      const usuarioId = req.user?.perfil_id ?? req.user?.id ?? req.user?.usuario_id ?? null;
      await otorgarPuntosBienvenida({ clienteId, usuarioId });
    }

    // Mantengo el formato de respuesta para no romper front
    res.status(201).json({ ok: true, cliente: data });
  } catch (err) {
    if (String(err.message).toLowerCase().includes("rut inválido")) {
      return res.status(400).json({ ok: false, message: "RUT inválido" });
    }
    next(err);
  }
}

export async function actualizarCliente(req, res, next) {
  try {
    const { id } = req.params;
    // ✅ aceptamos fuente_id
    const { rut, nombres, apellidos, email, telefono, estado, fuente_id } = req.body || {};

    if (!id) return res.status(400).json({ ok: false, message: "Falta id" });

    const payload = {};

    if (rut !== undefined) payload.rut = validarYNormalizarRut(rut);

    if (nombres !== undefined) {
      if (!String(nombres).trim()) {
        return res.status(400).json({ ok: false, message: "El nombre es obligatorio" });
      }
      payload.nombres = String(nombres).trim();
    }

    if (apellidos !== undefined) payload.apellidos = apellidos ? String(apellidos).trim() : null;
    if (email !== undefined) payload.email = email ? String(email).trim() : null;
    if (telefono !== undefined) payload.telefono = telefono ? String(telefono).trim() : null;

    if (estado !== undefined) {
      const st = String(estado).toLowerCase();
      if (!["activo", "bloqueado"].includes(st)) {
        return res.status(400).json({ ok: false, message: "Estado inválido" });
      }
      payload.estado = st;
    }

    // ✅ permitir actualizar fuente (uuid o null)
    if (fuente_id !== undefined) {
      payload.fuente_id = fuente_id || null;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar" });
    }

    const { data, error } = await supabaseAdmin
      .from("clientes")
      .update(payload)
      .eq("id", id)
      .select(
        `id, rut, nombres, apellidos, telefono, email, estado, creado_en, fuente_id, fuentes_clientes ( id, nombre, tipo )`
      )
      .single();

    if (error) {
      const msg = error.message || "No se pudo actualizar el cliente";
      return res.status(400).json({ ok: false, message: msg });
    }

    return res.json({ ok: true, cliente: mapClienteRow(data) });
  } catch (err) {
    if (String(err.message).toLowerCase().includes("rut inválido")) {
      return res.status(400).json({ ok: false, message: "RUT inválido" });
    }
    next(err);
  }
}

/* -----------------------------
   Importar clientes (genérico)
------------------------------ */
export async function importarClientes(req, res, next) {
  try {
    const { drive_url, fuente_id, estrategia_duplicados } = req.body || {};

    if (!drive_url && !fuente_id) {
      return res.status(400).json({ ok: false, message: "Debes enviar drive_url o fuente_id" });
    }

    const estrategia = normalizeEstrategia(estrategia_duplicados);

    let driveUrlFinal = drive_url;
    let fuenteIdFinal = fuente_id || null;

    if (!driveUrlFinal && fuenteIdFinal) {
      const { data: fuente, error: fuenteErr } = await supabaseAdmin
        .from("fuentes_clientes")
        .select("id, url")
        .eq("id", fuenteIdFinal)
        .single();
      if (fuenteErr) throw fuenteErr;
      driveUrlFinal = fuente?.url;
    }

    if (!driveUrlFinal) {
      return res.status(400).json({ ok: false, message: "No se pudo resolver la URL" });
    }

    const resumen = await importarClientesDesdeUrl(driveUrlFinal, fuenteIdFinal, { estrategia });

    if (resumen?.requiere_confirmacion) {
      return res.json({ ok: true, fuente_id: fuenteIdFinal, ...resumen });
    }

    res.json({ ok: true, ...resumen });
  } catch (err) {
    next(err);
  }
}

/* -----------------------------
   Fuentes de clientes
------------------------------ */
export async function listarFuentesClientes(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .select(
        "id, nombre, url, tipo, activo, es_interna, creado_en, actualizado_en, ultima_recarga_en, ultima_recarga_resumen"
      )
      .order("creado_en", { ascending: false });

    if (error) throw error;
    res.json({ ok: true, fuentes: data || [] });
  } catch (err) {
    next(err);
  }
}

export async function crearFuenteClientes(req, res, next) {
  try {
    const { nombre, url, importar_ahora, estrategia_duplicados } = req.body || {};
    if (!nombre?.trim() || !url?.trim()) {
      return res.status(400).json({ ok: false, message: "Nombre y URL son obligatorios" });
    }

    const tipo = url.includes("spreadsheets") ? "google_sheets" : "drive_file";

    const { data: fuente, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .insert({
        nombre: nombre.trim(),
        url: url.trim(),
        tipo,
        activo: true,
      })
      .select(
        "id, nombre, url, tipo, activo, es_interna, creado_en, actualizado_en, ultima_recarga_en, ultima_recarga_resumen"
      )
      .single();

    if (error) throw error;

    if (!importar_ahora) {
      return res.status(201).json({ ok: true, fuente });
    }

    const estrategia = normalizeEstrategia(estrategia_duplicados);
    const resumen = await importarClientesDesdeUrl(fuente.url, fuente.id, { estrategia });

    if (resumen?.requiere_confirmacion) {
      return res.status(201).json({
        ok: true,
        fuente,
        requiere_confirmacion: true,
        duplicados: resumen.duplicados,
      });
    }

    await supabaseAdmin
      .from("fuentes_clientes")
      .update({
        ultima_recarga_en: new Date().toISOString(),
        ultima_recarga_resumen: resumen,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", fuente.id);

    return res.status(201).json({ ok: true, fuente, resumen });
  } catch (err) {
    next(err);
  }
}

export async function recargarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params;
    const { estrategia_duplicados } = req.body || {};
    const estrategia = normalizeEstrategia(estrategia_duplicados);

    const { data: fuente, error: fuenteErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .select("id, url, nombre")
      .eq("id", id)
      .single();
    if (fuenteErr) throw fuenteErr;

    const resumen = await importarClientesDesdeUrl(fuente.url, fuente.id, { estrategia });

    if (resumen?.requiere_confirmacion) {
      return res.json({
        ok: true,
        fuente_id: id,
        requiere_confirmacion: true,
        duplicados: resumen.duplicados,
      });
    }

    const { error: upErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .update({
        ultima_recarga_en: new Date().toISOString(),
        ultima_recarga_resumen: resumen,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id);

    if (upErr) throw upErr;

    res.json({ ok: true, fuente_id: id, ...resumen });
  } catch (err) {
    next(err);
  }
}

export async function actualizarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, url, activo } = req.body || {};

    const payload = {};
    if (nombre !== undefined) payload.nombre = String(nombre).trim();
    if (url !== undefined) payload.url = String(url).trim();
    if (activo !== undefined) payload.activo = !!activo;
    payload.actualizado_en = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .update(payload)
      .eq("id", id)
      .select(
        "id, nombre, url, tipo, activo, es_interna, creado_en, actualizado_en, ultima_recarga_en, ultima_recarga_resumen"
      )
      .single();

    if (error) throw error;
    res.json({ ok: true, fuente: data });
  } catch (err) {
    next(err);
  }
}

export async function eliminarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params;
    const cascade = String(req.query.cascade || "true").toLowerCase() !== "false";

    // ✅ NUEVO: bloquear eliminación si la fuente es interna
    const { data: fuente, error: fuenteErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .select("id, es_interna")
      .eq("id", id)
      .single();

    if (fuenteErr) throw fuenteErr;

    if (fuente?.es_interna) {
      return res.status(409).json({
        ok: false,
        message: "No puedes eliminar una fuente interna del sistema.",
      });
    }

    if (cascade) {
      const { error: delClientesErr } = await supabaseAdmin
        .from("clientes")
        .delete()
        .eq("fuente_id", id);
      if (delClientesErr) throw delClientesErr;
    } else {
      const { error: updErr } = await supabaseAdmin
        .from("clientes")
        .update({ fuente_id: null })
        .eq("fuente_id", id);
      if (updErr) throw updErr;
    }

    const { error } = await supabaseAdmin.from("fuentes_clientes").delete().eq("id", id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/* -----------------------------
   Import interno con “conflictos por fuente”
------------------------------ */
async function importarClientesDesdeUrl(driveUrl, fuente_id, { estrategia } = {}) {
  const buffer = await fetchXlsxFromDrive(driveUrl);
  const rows = parseClientesFromWorkbook(buffer);

  const totalProcesados = rows.length;
  const validBase = [];
  const invalidos = [];

  for (const r of rows) {
    try {
      const rut = validarYNormalizarRut(r.rut);
      const nombres = (r.nombres || "").trim();
      if (!nombres) throw new Error("Nombre vacío");

      validBase.push({
        rut,
        nombres,
        apellidos: r.apellidos ? r.apellidos.trim() : null,
        email: r.email ? r.email.trim() : null,
        telefono: r.telefono ? r.telefono.trim() : null,
        estado: "activo",
      });
    } catch (e) {
      invalidos.push({
        rut: r.rut,
        error: e.message || "RUT/Nombre inválido",
      });
    }
  }

  const incoming = validBase.map((v) => ({ ...v, fuente_id }));

  const ruts = Array.from(new Set(incoming.map((v) => v.rut))).filter(Boolean);

  // 1) Traer existentes con su fuente_id
  const existentesMap = new Map();
  if (ruts.length > 0) {
    const { data: existentes, error: exErr } = await supabaseAdmin
      .from("clientes")
      .select("rut, fuente_id")
      .in("rut", ruts);

    if (exErr) throw exErr;
    for (const e of existentes || []) {
      existentesMap.set(e.rut, e.fuente_id ?? null);
    }
  }

  // 2) Clasificar
  const ownRuts = new Set(); // ya eran de ESTA fuente -> se actualizan sin preguntar
  const conflictRuts = new Set(); // manual (null) o de OTRA fuente -> preguntar
  const newRuts = new Set(); // no existían -> insertar

  for (const rut of ruts) {
    if (!existentesMap.has(rut)) {
      newRuts.add(rut);
      continue;
    }
    const fuenteExistente = existentesMap.get(rut); // null o uuid
    if (fuenteExistente === fuente_id) {
      ownRuts.add(rut);
    } else {
      conflictRuts.add(rut);
    }
  }

  const conflictsCount = conflictRuts.size;

  // 3) Si hay conflictos y NO viene estrategia => pedir confirmación
  if (conflictsCount > 0 && !estrategia) {
    return {
      requiere_confirmacion: true,
      duplicados: {
        cantidad: conflictsCount,
        ruts_ejemplo: Array.from(conflictRuts).slice(0, 20),
      },
      procesados: totalProcesados,
      validos: incoming.length,
      invalidos: invalidos.length,
      invalidos_detalle: invalidos.slice(0, 20),
    };
  }

  // 4) Ejecutar estrategia:
  // - reemplazar: upsert todo (incluye actualizar los de la misma fuente + sobrescribir conflictos)
  // - omitir: NO tocar conflictos; pero SÍ actualizar los de la misma fuente y agregar nuevos
  if (estrategia === "omitir" && conflictsCount > 0) {
    const allowedRuts = new Set([...ownRuts, ...newRuts]);
    const payload = incoming.filter((v) => allowedRuts.has(v.rut));

    const { error } = await supabaseAdmin.from("clientes").upsert(payload, { onConflict: "rut" });
    if (error) throw error;

    return {
      procesados: totalProcesados,
      validos: incoming.length,
      invalidos: invalidos.length,
      insertados: newRuts.size,
      actualizados: ownRuts.size,
      omitidos_por_conflicto: conflictsCount,
      conflictos_detectados: conflictsCount,
      invalidos_detalle: invalidos.slice(0, 20),
    };
  }

  const { error } = await supabaseAdmin.from("clientes").upsert(incoming, { onConflict: "rut" });
  if (error) throw error;

  return {
    procesados: totalProcesados,
    validos: incoming.length,
    invalidos: invalidos.length,
    insertados: newRuts.size,
    actualizados: ownRuts.size + conflictsCount,
    conflictos_reemplazados: conflictsCount,
    invalidos_detalle: invalidos.slice(0, 20),
  };
}
