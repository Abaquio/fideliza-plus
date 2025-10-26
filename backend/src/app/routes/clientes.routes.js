import * as clientesController from '../controllers/clientes.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

export default async function clientesRoutes(app) {
  // Listado / búsqueda
  app.get('/clientes', clientesController.listar)

  // Crear nuevo cliente (protegido en beta si quieres)
  app.post('/clientes', { preHandler: authMiddleware() }, clientesController.crear)

  // Detalle por ID
  app.get('/clientes/:id', clientesController.detalle)

  // Editar (v1)
  app.put('/clientes/:id', { preHandler: authMiddleware() }, clientesController.editar)

  // Cambiar estado (v1)
  app.patch('/clientes/:id/estado', { preHandler: authMiddleware() }, clientesController.cambiarEstado)
}