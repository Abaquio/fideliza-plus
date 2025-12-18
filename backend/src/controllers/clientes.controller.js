import { supabaseAdmin } from "../db/supabaseAdmin.js"
import { validarYNormalizarRut } from "../utils/rut.js"
import * as XLSX from "xlsx"

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

  // ✅ Google Sheets => export XLSX
  if (url.includes("docs.google.com/spreadsheets/")) {
    const id = extractDriveFileId(url)
    if (!id) return null
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`
  }

  // ✅ Si ya viene en formato uc?export=download&id=... lo dejamos
  if (url.includes("drive.google.com/uc?") && url.includes("id=")) return url

  // ✅ Drive file normal
  const id = extractDriveFileId(url)
  if (!id) return null
  return `https://drive.google.com/uc?export=download&id=${id}`
}

function inferTipoFuente(url = "") {
  const u = String(url || "")
  if (u.includes("docs.google.com/spreadsheets/")) return "google_sheets"
  if (u.includes("drive.google.com/")) return "drive_file"
  return "otro"
}

function normalizeSpaces(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
}

function normalizeEmail(s) {
  const v = String(s ?? "").trim()
  if (!v) return null
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!regex.test(v)) throw new Error("Email inválido")
  return v
}

function normalizePhone(s) {
  const raw = String(s ?? "").trim()
  if (!raw) return null

  const digits = raw.replace(/[^\d]/g, "")

  if (digits.startsWith("56") && digits.length === 11) return `+${digits}`
  if (digits.startsWith("9") && digits.length === 9) return `+56${digits}`

  throw new Error("Teléfono inválido")
}

function getValueCaseInsensitive(obj, key) {
  if (!obj) return ""
  const wanted = key.toLowerCase()
  for (const k of Object.keys(obj)) {
    if (String(k).toLowerCase().trim() === wanted) return obj[k]
  }
  return ""
}

function sheetRowsToObjects(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { defval: "" })
}

function isMissingColumnError(err, columnName) {
  const msg = String(err?.message || "").toLowerCase()
  return msg.includes("does not exist") && msg.includes(columnName.toLowerCase())
}

// ------------------------
// Core import logic (reutilizable)
// - NO rompe si aún no existe clientes.fuente_id:
//   intenta upsert con fuente_id, y si falla por columna inexistente, reintenta sin fuente_id
// ------------------------
async function importarClientesDesdeUrl(drive_url, fuente_id = null) {
  const directUrl = toDirectDriveDownload(drive_url?.trim?.() || "")
  if (!directUrl) {
    const err = new Error("Link de Drive inválido")
    err.status = 400
    throw err
  }

  const resp = await fetch(directUrl, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  })

  if (!resp.ok) {
    const err = new Error(
      "No se pudo descargar el archivo. Verifica que sea 'Cualquiera con el enlace puede ver'."
    )
    err.status = 400
    throw err
  }

  const contentType = resp.headers.get("content-type") || ""
  const buf = Buffer.from(await resp.arrayBuffer())

  if (contentType.includes("text/html")) {
    const err = new Error(
      "Google devolvió una página HTML. Revisa permisos ('Cualquiera con el enlace puede ver') o exporta a XLSX/CSV."
    )
    err.status = 400
    throw err
  }

  const workbook = XLSX.read(buf, { type: "buffer" })
  const firstSheetName = workbook.SheetNames?.[0]
  if (!firstSheetName) {
    const err = new Error("El Excel no tiene hojas")
    err.status = 400
    throw err
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = sheetRowsToObjects(sheet)

  if (!Array.isArray(rows) || rows.length === 0) {
    const err = new Error("El Excel está vacío o no tiene filas")
    err.status = 400
    throw err
  }

  const validBase = []
  const invalidos = []
  const seenRut = new Set()

  rows.forEach((r, idx) => {
    const rowNum = idx + 2
    try {
      const rutRaw = getValueCaseInsensitive(r, "rut")
      const nombresRaw = getValueCaseInsensitive(r, "nombres")
      const apellidosRaw = getValueCaseInsensitive(r, "apellidos")
      const emailRaw = getValueCaseInsensitive(r, "email")
      const telefonoRaw = getValueCaseInsensitive(r, "telefono")

      const rut = validarYNormalizarRut(rutRaw)
      const nombres = normalizeSpaces(nombresRaw)
      if (!nombres) throw new Error("Nombre vacío")

      if (seenRut.has(rut)) throw new Error("RUT repetido dentro del Excel")
      seenRut.add(rut)

      validBase.push({
        rut,
        nombres,
        apellidos: apellidosRaw ? normalizeSpaces(apellidosRaw) : null,
        email: emailRaw ? normalizeEmail(emailRaw) : null,
        telefono: telefonoRaw ? normalizePhone(telefonoRaw) : null,
        estado: "activo",
      })
    } catch (e) {
      invalidos.push({ fila: rowNum, error: e.message || "Fila inválida" })
    }
  })

  if (validBase.length === 0) {
    const err = new Error("No hay filas válidas para importar")
    err.status = 400
    err.payload = {
      resumen: { procesados: rows.length, validos: 0, invalidos: invalidos.length },
      invalidos: invalidos.slice(0, 20),
    }
    throw err
  }

  // existentes (para resumen)
  const ruts = validBase.map((v) => v.rut)

  const { data: existentesData, error: existErr } = await supabaseAdmin
    .from("clientes")
    .select("rut")
    .in("rut", ruts)

  if (existErr) throw existErr

  const existentes = new Set((existentesData || []).map((x) => x.rut))
  const duplicados = existentes.size
  const nuevos = validBase.length - duplicados

  // intentamos upsert con fuente_id si viene, pero sin romper si aún no existe la columna
  let upsertErr = null
  if (fuente_id) {
    const validWithFuente = validBase.map((v) => ({ ...v, fuente_id }))
    const { error } = await supabaseAdmin.from("clientes").upsert(validWithFuente, { onConflict: "rut" })
    if (error) {
      // si falta columna, reintentamos sin fuente_id
      if (isMissingColumnError(error, "fuente_id")) {
        const { error: error2 } = await supabaseAdmin.from("clientes").upsert(validBase, { onConflict: "rut" })
        upsertErr = error2 || null
      } else {
        upsertErr = error
      }
    }
  } else {
    const { error } = await supabaseAdmin.from("clientes").upsert(validBase, { onConflict: "rut" })
    upsertErr = error || null
  }

  if (upsertErr) throw upsertErr

  const resumen = {
    procesados: rows.length,
    validos: validBase.length,
    insertados_estimados: nuevos,
    actualizados_estimados: duplicados,
    invalidos: invalidos.length,
  }

  return { resumen, invalidos: invalidos.slice(0, 20) }
}

// ------------------------
// Existente (sin romper)
// ------------------------
export async function listarClientes(req, res, next) {
  try {
    const search = (req.query.search || "").trim()

    let query = supabaseAdmin
      .from("clientes")
      .select("id, rut, nombres, apellidos, telefono, email, estado, creado_en")
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

    const clientes = (data || []).map((c) => ({
      ...c,
      puntos_total: 0,
      compras_total: 0,
    }))

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
      .select("id, rut, nombres, apellidos, telefono, email, estado, creado_en")
      .single()

    if (error) {
      if (String(error.message || "").toLowerCase().includes("duplicate")) {
        return res.status(409).json({ ok: false, message: "Ya existe un cliente con ese RUT" })
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

/**
 * ✅ NUEVO (sin romper): PATCH /api/clientes/:id
 * Actualiza datos del cliente (rut, nombres, apellidos, email, telefono, estado)
 */
export async function actualizarCliente(req, res, next) {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ ok: false, message: "Falta id" })

    const { rut, nombres, apellidos, email, telefono, estado } = req.body || {}

    // PATCH real: solo campos enviados
    const update = {}

    if (rut !== undefined) update.rut = validarYNormalizarRut(rut)
    if (nombres !== undefined) {
      const n = normalizeSpaces(nombres)
      if (!n) return res.status(400).json({ ok: false, message: "El nombre es obligatorio" })
      update.nombres = n
    }
    if (apellidos !== undefined) update.apellidos = apellidos ? normalizeSpaces(apellidos) : null
    if (email !== undefined) update.email = email ? normalizeEmail(email) : null
    if (telefono !== undefined) update.telefono = telefono ? normalizePhone(telefono) : null
    if (estado !== undefined) {
      if (!["activo", "bloqueado"].includes(estado)) {
        return res.status(400).json({ ok: false, message: "Estado inválido" })
      }
      update.estado = estado
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ ok: false, message: "No hay campos para actualizar" })
    }

    const { data, error } = await supabaseAdmin
      .from("clientes")
      .update(update)
      .eq("id", id)
      .select("id, rut, nombres, apellidos, telefono, email, estado, creado_en")
      .single()

    if (error) {
      const msg = String(error.message || "").toLowerCase()
      if (msg.includes("duplicate") || msg.includes("unique")) {
        return res.status(409).json({ ok: false, message: "Ya existe un cliente con ese RUT o email" })
      }
      throw error
    }

    return res.json({ ok: true, cliente: data })
  } catch (err) {
    if (String(err.message || "").toLowerCase().includes("rut inválido")) {
      return res.status(400).json({ ok: false, message: "RUT inválido" })
    }
    next(err)
  }
}

// ------------------------
// Importar (mantiene el endpoint actual)
// POST /api/clientes/importar
// body: { drive_url } o { fuente_id } o ambos
// ------------------------
export async function importarClientes(req, res, next) {
  try {
    const { drive_url, fuente_id } = req.body || {}

    let finalUrl = drive_url?.trim?.() || ""

    // ✅ Si viene fuente_id, usamos su URL (si no pasaron drive_url)
    if (!finalUrl && fuente_id) {
      const { data: fuente, error } = await supabaseAdmin
        .from("fuentes_clientes")
        .select("id, url")
        .eq("id", fuente_id)
        .single()

      if (error || !fuente) {
        return res.status(404).json({ ok: false, message: "Fuente no encontrada" })
      }

      finalUrl = fuente.url
    }

    if (!finalUrl) {
      return res.status(400).json({ ok: false, message: "Falta drive_url" })
    }

    const { resumen, invalidos } = await importarClientesDesdeUrl(finalUrl, fuente_id || null)

    // ✅ Si viene fuente_id, actualizamos metadata de la fuente (sin afectar tu flujo actual)
    if (fuente_id) {
      await supabaseAdmin
        .from("fuentes_clientes")
        .update({
          ultima_recarga_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
          ultima_recarga_resumen: resumen,
        })
        .eq("id", fuente_id)
    }

    return res.status(200).json({
      ok: true,
      resumen,
      invalidos,
    })
  } catch (err) {
    if (err?.payload) {
      return res.status(err.status || 400).json({
        ok: false,
        message: err.message || "Error importando",
        ...err.payload,
      })
    }
    return next(err)
  }
}

// ------------------------
// ✅ FUENTES
// ------------------------
export async function listarFuentesClientes(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .select("*")
      .order("creado_en", { ascending: false })

    if (error) throw error

    res.json({ ok: true, fuentes: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function crearFuenteClientes(req, res, next) {
  try {
    const { nombre, url, tipo, importar_ahora } = req.body || {}

    if (!nombre?.trim()) {
      return res.status(400).json({ ok: false, message: "Falta nombre" })
    }
    if (!url?.trim()) {
      return res.status(400).json({ ok: false, message: "Falta url" })
    }

    const nowIso = new Date().toISOString()

    const payload = {
      nombre: nombre.trim(),
      url: url.trim(),
      tipo: (tipo || inferTipoFuente(url)).trim(),
      activo: true,
      creado_en: nowIso,
      actualizado_en: nowIso,
    }

    // 1) Crear fuente
    const { data: fuente, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .insert(payload)
      .select("*")
      .single()

    if (error) throw error

    // 2) (Opcional) Importar inmediatamente
    if (importar_ahora === true) {
      const { resumen, invalidos } = await importarClientesDesdeUrl(fuente.url, fuente.id)

      const now2 = new Date().toISOString()
      await supabaseAdmin
        .from("fuentes_clientes")
        .update({
          ultima_recarga_en: now2,
          actualizado_en: now2,
          ultima_recarga_resumen: resumen,
        })
        .eq("id", fuente.id)

      return res.status(201).json({ ok: true, fuente, resumen, invalidos })
    }

    // Si no se pidió importar ahora, se comporta como antes
    return res.status(201).json({ ok: true, fuente })
  } catch (err) {
    next(err)
  }
}

export async function actualizarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params
    const { nombre, url, tipo, activo } = req.body || {}

    if (!id) return res.status(400).json({ ok: false, message: "Falta id" })

    const update = {
      actualizado_en: new Date().toISOString(),
    }

    if (typeof nombre === "string") update.nombre = nombre.trim()
    if (typeof url === "string") update.url = url.trim()
    if (typeof tipo === "string") update.tipo = tipo.trim()
    if (typeof activo === "boolean") update.activo = activo

    const { data, error } = await supabaseAdmin
      .from("fuentes_clientes")
      .update(update)
      .eq("id", id)
      .select("*")
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
    if (!id) return res.status(400).json({ ok: false, message: "Falta id" })

    const { data: fuente, error: fuenteErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .select("*")
      .eq("id", id)
      .single()

    if (fuenteErr || !fuente) {
      return res.status(404).json({ ok: false, message: "Fuente no encontrada" })
    }

    if (fuente.activo === false) {
      return res.status(400).json({ ok: false, message: "La fuente está desactivada" })
    }

    const { resumen, invalidos } = await importarClientesDesdeUrl(fuente.url, id)

    const nowIso = new Date().toISOString()
    const { error: updErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .update({
        ultima_recarga_en: nowIso,
        actualizado_en: nowIso,
        ultima_recarga_resumen: resumen,
      })
      .eq("id", id)

    if (updErr) throw updErr

    res.json({ ok: true, fuente_id: id, resumen, invalidos })
  } catch (err) {
    if (err?.payload) {
      return res.status(err.status || 400).json({
        ok: false,
        message: err.message || "Error recargando",
        ...err.payload,
      })
    }
    next(err)
  }
}

// ------------------------
// ✅ NUEVO: Eliminar fuente
// - DELETE /api/clientes/fuentes/:id
// - DELETE /api/clientes/fuentes/:id?cascade=true  -> intenta borrar clientes por fuente_id (si existe la columna)
// ------------------------
export async function eliminarFuenteClientes(req, res, next) {
  try {
    const { id } = req.params
    const cascade = String(req.query.cascade || "false") === "true"

    if (!id) return res.status(400).json({ ok: false, message: "Falta id" })

    if (cascade) {
      // Esto requiere clientes.fuente_id (aún no lo has agregado).
      // Si no existe, respondemos claro y NO rompemos nada.
      const { error: delClientesErr } = await supabaseAdmin
        .from("clientes")
        .delete()
        .eq("fuente_id", id)

      if (delClientesErr) {
        if (isMissingColumnError(delClientesErr, "fuente_id")) {
          return res.status(400).json({
            ok: false,
            message:
              "Para borrar clientes de una fuente debes agregar la columna clientes.fuente_id. Ejecuta el ALTER y vuelve a intentar con cascade=true.",
          })
        }
        throw delClientesErr
      }
    }

    const { error: delFuenteErr } = await supabaseAdmin
      .from("fuentes_clientes")
      .delete()
      .eq("id", id)

    if (delFuenteErr) throw delFuenteErr

    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
