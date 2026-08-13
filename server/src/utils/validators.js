export function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validateAuthInput({ name, email, password }) {
  if (name !== undefined) {
    const trimmedName = String(name).trim()
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      throw new Error('Le nom doit contenir entre 2 et 50 caractères.')
    }
  }

  if (!isValidEmail(email)) {
    throw new Error('Un email valide est requis.')
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new Error('Le mot de passe doit contenir entre 8 et 128 caractères.')
  }
}

export function isValidObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)
}

export function normalizeText(value, maxLength = 255) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}
