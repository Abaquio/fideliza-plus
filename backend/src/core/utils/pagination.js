export function parsePagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit ?? '20', 10), 1), 100)
  const offset = Math.max(parseInt(query.offset ?? '0', 10), 0)
  return { limit, offset }
}