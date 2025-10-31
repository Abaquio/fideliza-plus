// src/core/db/queries/clientes.queries.js
import { supabase } from '../supabase.client.js'

/**
 * Limpia un RUT de puntos y guión.
 * Ej: "12.345.678-9" -> "123456789"
 */
function cleanRut(input = '') {
  return String(input).replace(/[.\-]/g, '')
}

/**
 * Obtiene clientes desde Supabase con paginación y filtro opcional por RUT.
 *
 * @param {Object} params
 * @param {number} params.limit   - máximo de filas (1..100)
 * @param {number} params.offset  - desplazamiento (>=0)
 * @param {string} [params.search] - término de búsqueda
 * @param {"rut"}  [params.by]     - en v1 sólo filtramos por RUT en BD
 */
export async function selectClientes({ limit = 20, offset = 0, search, by } = {}) {
  const from = offset
  const to = offset + limit - 1

  let query = supabase
    .from('clientes')
    .select(
      `
      id,
      rut_formateado,
      rut_normalizado,
      dv,
      nombre_completo,
      email,
      telefono,
      estado,
      created_at
    `,
      { count: 'exact' }
    )
    .order('rut_normalizado', { ascending: true })
    .range(from, to)

  // Filtro por RUT (parcial) en BD
  if (search && (by === 'rut' || !by)) {
    const searchClean = cleanRut(search)
    if (searchClean) {
      query = query.or(
        `rut_formateado.ilike.%${search}%,rut_normalizado.ilike.%${searchClean}%`
      )
    } else {
      query = query.ilike('rut_formateado', `%${search}%`)
    }
  }

  const { data, error, count } = await query
  if (error) throw error

  // Mapeo a camelCase que consume el front
  const items = (data || []).map((row) => ({
    id: row.id,
    rut: row.rut_formateado,
    rut_formateado: row.rut_formateado,
    rut_normalizado: row.rut_normalizado,
    dv: row.dv,
    nombreCompleto: row.nombre_completo ?? '',
    email: row.email ?? '',
    telefono: row.telefono ?? '',
    estado: row.estado ?? null,
    created_at: row.created_at,
    // placeholders por ahora
    puntos: 0,
    compras: 0,
  }))

  return {
    items,
    total: count ?? items.length,
  }
}

// --- DETALLE DE CLIENTE POR ID ---
export async function selectClienteById(id) {
  if (!id) throw new Error('id is required')

  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id,
      rut_formateado,
      rut_normalizado,
      dv,
      nombre_completo,
      email,
      telefono,
      estado,
      created_at
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) return null

  // Mapea a camelCase para el front
  return {
    id: data.id,
    rut: data.rut_formateado,
    rut_formateado: data.rut_formateado,
    rut_normalizado: data.rut_normalizado,
    dv: data.dv,
    nombreCompleto: data.nombre_completo ?? '',
    email: data.email ?? '',
    telefono: data.telefono ?? '',
    estado: data.estado ?? null,
    created_at: data.created_at,
    // placeholders por ahora (luego los conectamos a compras/puntos reales)
    puntos: 0,
    compras: 0,
    notas: data.notas ?? '',
  }
}
/* Stubs para las demás operaciones (se implementarán luego) */
export async function insertCliente(/* dto */) { /* TODO */ }
export async function updateCliente(/* id, dto */) { /* TODO */ }
export async function updateEstado(/* id, estado */) { /* TODO */ }