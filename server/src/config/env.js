import 'dotenv/config'

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medibible',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  livekitUrl: process.env.LIVEKIT_URL || '',
  livekitApiKey: process.env.LIVEKIT_API_KEY || '',
  livekitApiSecret: process.env.LIVEKIT_API_SECRET || '',
}

export function validateEnv() {
  const requiredInProduction = []

  if (env.nodeEnv === 'production') {
    if (!process.env.MONGO_URI) requiredInProduction.push('MONGO_URI')
    if (!process.env.JWT_SECRET) requiredInProduction.push('JWT_SECRET')
    if (!process.env.CLIENT_URL) requiredInProduction.push('CLIENT_URL')
  }

  if (requiredInProduction.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes en production : ${requiredInProduction.join(', ')}`
    )
  }

  if (env.nodeEnv !== 'production' && env.jwtSecret === 'dev-secret-change-me') {
    console.warn('[env] JWT_SECRET par défaut utilisée en mode développement. Configurez une valeur forte.')
  }
}
