// Esqueleto del servidor (sin lógica)
// - Registra middlewares
// - Registra rutas
// - Arranca servidor

import Fastify from 'fastify'
import cors from "@fastify/cors";

import { corsMiddleware } from './middlewares/cors.middleware.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { authMiddleware } from './middlewares/auth.middleware.js'

import saludRoutes from './routes/salud.routes.js'
import clientesRoutes from './routes/clientes.routes.js'

import { env } from '../core/config/env.js'

const app = Fastify({ logger: true })

// CORS
await app.register(cors, corsMiddleware())

// Auth simple (beta) -> aplicar selectivamente en rutas protegidas
app.addHook('preHandler', (req, reply, done) => {
  // noop: se activará por ruta con preHandler: authMiddleware
  done()
})

// Rutas
await app.register(saludRoutes, { prefix: '/api' })
await app.register(clientesRoutes, { prefix: '/api' })

// Manejo de errores
app.setErrorHandler(errorMiddleware())

// Start
const port = env.PORT || 3000
app.listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`API running on http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })