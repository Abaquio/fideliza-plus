// src/app/routes/clientes.routes.js
import { getClientes } from '../controllers/clientes.controller.js'
import { getClienteById } from '../controllers/clientes.controller.js'

export default async function clientesRoutes(app) {
  app.get('/clientes', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit:   { type: 'number' },
          offset:  { type: 'number' },
          search:  { type: 'string' },
          by:      { type: 'string', enum: ['rut'] },
        },
        additionalProperties: true,
      },
    },
    handler: getClientes,
  })

  // NUEVO: detalle
  app.get('/clientes/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    handler: getClienteById,
  })
}