// src/app/controllers/clientes.controller.js
import { selectClientes } from '../../core/db/queries/clientes.queries.js'

/**
 * GET /api/clientes
 * Query params:
 *  - limit   (number)  default 20
 *  - offset  (number)  default 0
 *  - search  (string)  término de búsqueda
 *  - by      (string)  "rut" | (en V1 sólo rut; nombre lo haremos en front)
 */
export async function getClientes(req, reply) {
  try {
    const {
      limit = 20,
      offset = 0,
      search = '',
      by = 'rut',
    } = req.query || {}

    const result = await selectClientes({
      limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
      offset: Math.max(Number(offset) || 0, 0),
      search: typeof search === 'string' ? search.trim() : '',
      by,
    })

    return reply.send({
      items: result.items,
      pagination: {
        limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
        offset: Math.max(Number(offset) || 0, 0),
        total: result.total,
      },
    })
  } catch (err) {
    req.log.error({ err }, 'Error listando clientes')
    return reply.status(500).send({ message: 'Error listando clientes' })
  }
}

// ... getClientes (ya lo tienes) ...

export async function getClienteById(req, reply) {
  try {
    const { id } = req.params || {}
    const cliente = await selectClienteById(id)
    if (!cliente) return reply.code(404).send({ message: 'Cliente no encontrado' })
    return reply.send(cliente)
  } catch (err) {
    req.log.error({ err }, 'Error obteniendo cliente')
    return reply.status(500).send({ message: 'Error obteniendo cliente' })
  }
}