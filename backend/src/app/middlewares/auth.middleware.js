import { env } from '../../core/config/env.js'

export function authMiddleware() {
  return (req, reply, done) => {
    const key = req.headers['x-admin-key']
    if (!env.ADMIN_API_KEY || key === env.ADMIN_API_KEY) return done()
    reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid admin key' } })
  }
}