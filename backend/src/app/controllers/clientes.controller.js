// Solo firmas y respuestas mínimas para cablear luego:

export async function listar(req, reply) {
  // TODO: leer query ?search=&by=
  reply.send({ items: [], pagination: { limit: 20, offset: 0, total: 0 } })
}

export async function crear(req, reply) {
  // TODO: validar payload, normalizar RUT, insertar en DB
  reply.code(201).send({ id: 'uuid-demo' })
}

export async function detalle(req, reply) {
  // TODO: select por id
  reply.send({ id: req.params.id })
}

export async function editar(req, reply) {
  // TODO: update por id
  reply.send({ id: req.params.id, updated: true })
}

export async function cambiarEstado(req, reply) {
  // TODO: patch estado
  reply.send({ id: req.params.id, estado: 'activo' })
}