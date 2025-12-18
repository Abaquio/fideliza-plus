import { supabaseAdmin } from "../db/supabaseAdmin.js"
import { validarYNormalizarRut } from "../utils/rut.js"

export async function listarClientes(req, res, next) {
  try {
    const search = (req.query.search || "").trim()

    let query = supabaseAdmin
      .from("clientes")
      .select("id, rut, nombres, apellidos, telefono, email, estado, creado_en")
      .order("creado_en", { ascending: false })
      .limit(100)

    if (search) {
      // Buscamos por rut, nombres, apellidos, email, telefono (OR)
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

    // Para tu UI: dejamos campos opcionales para puntos/compras (los calculamos después con vistas/RPC)
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
      // Rut unique -> mensaje amigable
      if (String(error.message || "").toLowerCase().includes("duplicate")) {
        return res.status(409).json({ ok: false, message: "Ya existe un cliente con ese RUT" })
      }
      throw error
    }

    res.status(201).json({ ok: true, cliente: data })
  } catch (err) {
    // Rut inválido
    if (String(err.message).toLowerCase().includes("rut inválido")) {
      return res.status(400).json({ ok: false, message: "RUT inválido" })
    }
    next(err)
  }
}
