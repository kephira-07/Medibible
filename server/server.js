import { createServer } from 'http'
import { createApp } from './src/app.js'
import { initSocket } from './src/sockets/index.js'
import { connectDB } from './src/config/db.js'
import { env } from './src/config/env.js'

async function main() {
  await connectDB()

  const app = createApp()
  const httpServer = createServer(app)
  initSocket(httpServer)

  httpServer.listen(env.port, () => {
    console.log(`[server] MediBible API à l'écoute sur le port ${env.port}`)
  })
}

main().catch((err) => {
  console.error('[server] Échec du démarrage :', err)
  process.exit(1)
})
