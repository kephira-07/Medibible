export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err)

  // Erreurs de validation Mongoose (ex: 2-3 options, au moins une bonne réponse)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Données invalides.',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([path, e]) => [path, e.message])
      ),
    })
  }

  // ObjectId mal formé dans l'URL (ex: /api/quizzes/abc)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Identifiant invalide : ${err.value}` })
  }

  // Contrainte unique Mongo (ex: email déjà utilisé) échappée d'une opération concurrente
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Une ressource avec ces informations existe déjà.' })
  }

  const status = err.status || 500
  res.status(status).json({ message: err.message || 'Erreur serveur interne' })
}
