export function errorMiddleware() {
  return (error, req, reply) => {
    const status = error.statusCode || 500
    reply.code(status).send({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Something went wrong',
        details: error.details || null
      }
    })
  }
}