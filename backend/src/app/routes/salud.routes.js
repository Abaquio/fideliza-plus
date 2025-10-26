export default async function saludRoutes(app) {
  app.get('/health', async () => {
    return { status: 'ok', time: new Date().toISOString() }
  })
}