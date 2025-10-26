import { env } from '../../core/config/env.js'

export function corsMiddleware() {
  return {
    origin: env.CORS_ORIGIN || '*',
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','x-admin-key']
  }
}