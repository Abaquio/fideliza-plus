import { supabaseAdmin } from "../db/supabaseAdmin.js"
import { validarYNormalizarRut } from "../utils/rut.js"
import * as XLSX from "xlsx"

function pickFuenteEmbed(row) {
  const f = row?.fuentes_clientes
  if (!f) return null
  return Array.isArray(f) ? (f[0] || null) : f
}

function mapClienteRow(row) {
  const fuente = pickFuenteEmbed(row)
  return {
    ...row,
    fuente_id: row?.fuente_id ?? null,
    fuente_nombre: fuente?.nombre ?? null,
    fuente: fuente
      ? { id: fuente.id ?? null, nombre: fuente.nombre ?? null, tipo: fuente.tipo ?? null }
      : null,
    puntos_total: 0,
    compras_total: 0,
  }
}

// ------------------------
// Helpers (solo backend)
// ------------------------
function extractDriveFileId(url = "") {
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (m1?.[1]) return m1[1]

  const m2 = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (m2?.[1]) return m2[1]

  const m3 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m3?.[1]) return m3[1]

  return null
}

/**
 * Soporta:
 * - Google Sheets: https://docs.google.com/spreadsheets/d/<ID>/edit...
 * - Drive file:   https://drive.google.com/file/d/<ID>/view...
 * - Drive uc:     https://drive.google.com/uc?export=download&id=<ID>
 */
function toDirectDriveDownload(url) {
  if (!url) return null

  if (url.includes("docs.google.com/spreadsheets/")) {
    const id = extractDriveFileId(url)
    if (!id) return null
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`
  }

  if (url.includes("drive.google.com/file/")) {
    const id = extractDriveFileId(url)
    if (!id) return null
    return `https://drive.google.com/uc?export=download&id=${id}`
  }

  if (url.includes("drive.google.com/uc")) return url
  if (url.includes("export=download") && url.includes("id=")) return url

  if (url.includes("drive.google.com/open")) {
    const id = extractDriveFileId(url)
    if (!id) return null
    return `https://drive.google.com/uc?export=download&id=${id}`
  }

  return null
}

async function fetchXlsxFromDrive(driveUrl) {
  const direct = toDirectDriveDownload(driveUrl)
  if (!direct) {
    const err = new Error("No se pudo interpretar el link de Drive/Sheets")
    err.statusCode = 400
    throw err
  }

  const resp = await fetch(direct, { redirect: "follow" })
  if (!resp.ok) {
    const err = new Error(
      "No se pudo descargar el archivo. Verifica que sea 'Cualquiera con el enlace puede ver'."
    )
    err.statusCode = 400
    throw err
  }

  const ab = await resp.arrayBuffer()
  return Buffer.from(ab)
}

function parseClientesFromWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" })
  const sheetName = wb.SheetNames?.[0]
  if (!sheetName) return []

  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" })

  return (rows || []).map((r) => ({
    rut: String(r.rut || r.RUT || "").trim(),
    nombres: String(r.nombres || r.Nombres || "").trim(),
    apellidos: String(r.apellidos || r.Apellidos || "").trim(),
    email: String(r.email || r.Email || "").trim(),
    telefono: String(r.telefono || r.Telefono || "").trim(),
  }))
}

function normalizeEstrategia(value) {
  const v = String(value || "").toLowerCase().trim()
  if (v === "reemplazar") return "reemplazar"
  if (v === "omitir") return "omitir"
  return null
}

// ------------------------
// Listar clientes
// ------------------------
export async function listarClientes(req, res, next) {
  try {
    const search = (req.query.search || "").trim()

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
      .limit(100)

    if (search) {
      query = query.or(
        [
          `rut.ilike.%${search}%`,
          `nombres.ilike.%${search}%`,
          `apellidos.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `telefono.ilike.%${search}%`,
        ].join(",")
      )
    }

    const { data, error } = await query
    if (error) throw error

    const clientes = (data || []).map((c) => mapClienteRow(c))
    res.json({ ok: true, clientes })
  } catch (err) {
    next(err)
  }
}

export async function crearCliente(req, res, next) {
  try {
    const { rut, nombres, apellidos, email, telefono } = req.body || {}

    const rutNormalizado = validarYNormalizarRut(rut)
    if (!nombres?.trim()) {
      return res.status(400).json({ ok: false, message: "El nombre es obligatorio" })
    }

    const payload = {
      rut: rutNormalizado,
      nombres: nombres.trim(),
      apellidos: apellidos ? apellidos.trim() : null,
      email: email ? email.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      estado: "activo",
    }

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
      `)

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ ok: false, message: "El RUT ya existe" })
      }
      throw error
    }

    res.status(201).json({ ok: true, cliente: data })
  } catch (err) {
    if (String(err.message).toLowerCase().includes("rut inválido")) {
      return res.status(400).json({ ok: false, message: "RUT inválido" })
    }
    next(err)
  }
}

// ------------------------
// Editar cliente
// ------------------------
export async function actualizarCliente(req, res, next) {
  try {
    const { id } = req.params
    const { rut, nombres, apellidos, email, telefono, estado } = req.body || {}

    if (!id) return res.status(400).json({ ok: false, message: "Falta id" })

    const payload = {}

    if (rut !== undefined) payload.rut = validarYNormalizarRut(rut)
    if (nombres !== undefined) {
      if (!String(nombres).trim()) {
        return res.status(400).json({ ok: false, message: "El nombre es obligatorio" })
      }
      payload.nombres = String(nombres).trim()
    }
    if (apellidos !== undefined) payload.apellidos = apellidos ? String(apellidos).trim() : null
    if (email !== undefined) payload.email = email ? String(email).trim() : null
    if (telefono !== undefined) payload.telefono = telefono ? String(telefono).trim() : null
    if (estado !== undefined) {
      const st = String(estado).toLowerCase()
      if (!["activo", "bloqueado"].includes(st)) {
        return res.status(400).json({ ok: false, message: "Estado inválido" })
      }
      payload.estado = st
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar" })
    }

    const { data, error } = await supabaseAdmin
      .from("clientes")
      .update(payload)
      .eq("id", id)
      .select(
        `id, rut, nombres, apellidos, telefono, email, estado, creado_en, fuente_id, fuentes_clientes ( id, nombre, tipo )`
      )
      .single()

    if (error) {
      const msg = error.message || "No se pudo actualizar el cliente"
      return res.status(400).json({ ok: false, message: msg })
    }

    return res.json({ ok: true, cliente: mapClienteRow(data) })
  } catch (err) {
    if (String(err.message).toLowerCase().includes("rut inválido")) {
      return res.status(400).json({ ok: false, message: "RUT inválido" })
    }
    next(err)
  }
}

// ------------------------
// Importar (endpoint actual)
// POST /api/clientes/importar
// body: { drive_url } o { fuente_id } o ambos
// + estrategia_duplicados: "reemplazar" | "omitir"
// -----------------------
export async function importarClientes(req, res, next) {
  try {
    const { drive_url, fuente_id, estrategia_duplicados } = req.body || {}

    if (!drive_url && !fuente_id) {
      return res.status(400).json({ ok: false, message: "Debes enviar drive_url o fuente_id" })
    }

    const estrategia = normalizeEstrategia(estrategia_duplicados)

    let driveUrlFinal = drive_url
    let fuenteIdFinal = fuente_id || null

    if (!driveUrlFinal && fuenteIdFinal) {
      const { data: fuente, error: fuenteErr } = await supabaseAdmin
        .from("fuentes_clientes")
        .select("id, url")
        .eq("id", fuenteIdFinal)
        .single()
      if (fuenteErr) throw fuenteErr
      driveUrlFinal = fuente?.url
    }

    if (driveUrlFinal && !fuenteIdFinal) {
      const { data: fuenteNueva, error: fuenteNuevaErr } = await supabaseAdmin
        .from("fuentes_clientes")
        .insert({
          nombre: "Fuente Google Sheets",
          url: driveUrlFinal,
          tipo: driveUrlFinal.includes("spreadsheets") ? "google_sheets" : "drive_file",
          activo: true,
        })
        .select("id")
        .single()

      if (fuenteNuevaErr) throw fuenteNuevaErr
      fuenteIdFinal = fuenteNueva.id
    }

    const resumen = await importarClientesDesdeUrl(driveUrlFinal, fuenteIdFinal, { estrategia })

    // Si requiere confirmación, NO escribir nada aún
    if (resumen?.requiere_confirmacion) {
      return res.json({ ok: true, fuente_id: fuenteIdFinal, ...resumen })
    }

    // Mantengo respuesta ok
    res.json({ ok: true, ...resumen })
  } catch (err) {
    next(err)
  }
}

// ------------------------
// Fuentes
// ------------------------
export async function listarFuentesClientes(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .select(
        "id, nombre, url, tipo, activo, creado_en, actualizado_en, ultima_recarga_en, ultima_recarga_resumen"
      )
      .order("creado_en", { ascending: false })

    if (error) throw error
    res.json({ ok: true, fuentes: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function crearFuenteClientes(req, res, next) {
  try {
    const { nombre, url, importar_ahora, estrategia_duplicados } = req.body || {}
    if (!nombre?.trim() || !url?.trim()) {
      return res.status(400).json({ ok: false, message: "Nombre y URL son obligatorios" })
    }

    const tipo = url.includes("spreadsheets") ? "google_sheets" : "drive_file"

    const { data: fuente, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .insert({
        nombre: nombre.trim(),
        url: url.trim(),
        tipo,
        activo: true,
      })
      .select(
        "id, nombre, url, tipo, activo, creado_en, actualizado_en, ultima_recarga_en, ultima_recarga_resumen"
      )
      .single()

    if (error) throw error

    // ✅ Si no se pidió importar, mantenemos el comportamiento original
    if (!importar_ahora) {
      return res.status(201).json({ ok: true, fuente })
    }

    const estrategia = normalizeEstrategia(estrategia_duplicados)
    const resumen = await importarClientesDesdeUrl(fuente.url, fuente.id, { estrategia })

    // Si requiere confirmación, no importamos todavía
    if (resumen?.requiere_confirmacion) {
      return res.status(201).json({
        ok: true,
        fuente,
        requiere_confirmacion: true,
        duplicados: resumen.duplicados,
      })
    }

    // Guardar resumen como recarga
    await supabaseAdmin
      .from("fuentes_clientes")
      .update({
        ultima_recarga_en: new Date().toISOString(),
        ultima_recarga_resumen: resumen,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", fuente.id)

    return res.status(201).json({ ok: true, fuente, resumen })
  } catch (err) {
    next(err)
  }
}

export async function actualizarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params
    const { nombre, url, activo } = req.body || {}

    const payload = {}
    if (nombre !== undefined) payload.nombre = String(nombre).trim()
    if (url !== undefined) payload.url = String(url).trim()
    if (activo !== undefined) payload.activo = !!activo
    payload.actualizado_en = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .update(payload)
      .eq("id", id)
      .select(
        "id, nombre, url, tipo, activo, creado_en, actualizado_en, ultima_recarga_en, ultima_recarga_resumen"
      )
      .single()

    if (error) throw error
    res.json({ ok: true, fuente: data })
  } catch (err) {
    next(err)
  }
}

export async function recargarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params
    const { estrategia_duplicados } = req.body || {}
    const estrategia = normalizeEstrategia(estrategia_duplicados)

    const { data: fuente, error: fuenteErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .select("id, url")
      .eq("id", id)
      .single()
    if (fuenteErr) throw fuenteErr

    const resumen = await importarClientesDesdeUrl(fuente.url, fuente.id, { estrategia })

    // Si requiere confirmación, NO se actualiza nada aún
    if (resumen?.requiere_confirmacion) {
      return res.json({
        ok: true,
        fuente_id: id,
        requiere_confirmacion: true,
        duplicados: resumen.duplicados,
      })
    }

    // Guardar resumen en la fuente
    const { error: upErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .update({
        ultima_recarga_en: new Date().toISOString(),
        ultima_recarga_resumen: resumen,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id)

    if (upErr) throw upErr

    res.json({ ok: true, fuente_id: id, ...resumen })
  } catch (err) {
    if (err?.payload) {
      return res.status(err.statusCode || 400).json({
        ok: false,
        message: err.message || "Error recargando",
        ...err.payload,
      })
    }
    next(err)
  }
}

export async function eliminarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params
    const cascade = String(req.query.cascade || "true").toLowerCase() !== "false"

    if (cascade) {
      const { error: delClientesErr } = await supabaseAdmin
        .from("clientes")
        .delete()
        .eq("fuente_id", id)
      if (delClientesErr) throw delClientesErr
    } else {
      const { error: updErr } = await supabaseAdmin
        .from("clientes")
        .update({ fuente_id: null })
        .eq("fuente_id", id)
      if (updErr) throw updErr
    }

    const { error } = await supabaseAdmin.from("fuentes_clientes").delete().eq("id", id)
    if (error) throw error

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// ------------------------
// Import internals (con control de duplicados)
// ------------------------
async function importarClientesDesdeUrl(driveUrl, fuente_id, { estrategia } = {}) {
  const buffer = await fetchXlsxFromDrive(driveUrl)
  const rows = parseClientesFromWorkbook(buffer)

  const totalProcesados = rows.length
  const validBase = []
  const invalidos = []

  for (const r of rows) {
    try {
      const rut = validarYNormalizarRut(r.rut)
      const nombres = (r.nombres || "").trim()
      if (!nombres) throw new Error("Nombre vacío")

      validBase.push({
        rut,
        nombres,
        apellidos: r.apellidos ? r.apellidos.trim() : null,
        email: r.email ? r.email.trim() : null,
        telefono: r.telefono ? r.telefono.trim() : null,
        estado: "activo",
      })
    } catch (e) {
      invalidos.push({
        rut: r.rut,
        error: e.message || "RUT/Nombre inválido",
      })
    }
  }

  const validWithFuente = validBase.map((v) => ({ ...v, fuente_id }))

  // ✅ Detectar duplicados por RUT antes de escribir
  const ruts = Array.from(new Set(validWithFuente.map((v) => v.rut))).filter(Boolean)

  let duplicados = []
  if (ruts.length > 0) {
    // Evitar URL demasiado grande: en caso de ser enorme, podrías paginar,
    // pero para beta y 100-500 ruts suele andar bien.
    const { data: existentes, error: exErr } = await supabaseAdmin
      .from("clientes")
      .select("rut")
      .in("rut", ruts)

    if (exErr) throw exErr
    duplicados = (existentes || []).map((x) => x.rut)
  }

  const dupCount = duplicados.length

  // Si hay duplicados y no viene estrategia => pedir confirmación (sin romper nada)
  if (dupCount > 0 && !estrategia) {
    return {
      requiere_confirmacion: true,
      duplicados: {
        cantidad: dupCount,
        ruts_ejemplo: duplicados.slice(0, 20),
      },
      procesados: totalProcesados,
      validos: validWithFuente.length,
      invalidos: invalidos.length,
      invalidos_detalle: invalidos.slice(0, 20),
    }
  }

  // ✅ Aplicar estrategia
  if (estrategia === "omitir" && dupCount > 0) {
    const setDup = new Set(duplicados)
    const soloNuevos = validWithFuente.filter((v) => !setDup.has(v.rut))

    // Insertar sin pisar los existentes
    const { error } = await supabaseAdmin
      .from("clientes")
      .upsert(soloNuevos, { onConflict: "rut", ignoreDuplicates: true })

    if (error) throw error

    return {
      procesados: totalProcesados,
      validos: validWithFuente.length,
      invalidos: invalidos.length,
      insertados: soloNuevos.length,
      actualizados: 0,
      omitidos_por_duplicado: dupCount,
      duplicados_detectados: dupCount,
      invalidos_detalle: invalidos.slice(0, 20),
    }
  }

  // reemplazar (o no hay duplicados)
  const { error } = await supabaseAdmin.from("clientes").upsert(validWithFuente, { onConflict: "rut" })
  if (error) throw error

  return {
    procesados: totalProcesados,
    validos: validWithFuente.length,
    invalidos: invalidos.length,
    insertados: Math.max(validWithFuente.length - dupCount, 0),
    actualizados: dupCount,
    duplicados_detectados: dupCount,
    invalidos_detalle: invalidos.slice(0, 20),
  }
}
