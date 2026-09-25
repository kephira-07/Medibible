// Doit rester synchronisé avec client/src/utils/avatars.js. On ne stocke que
// l'identifiant : une valeur inconnue envoyée par un client est ignorée.
export const AVATAR_IDS = [
  'paw', 'dove', 'tree', 'fish', 'anchor', 'star',
  'crown', 'book', 'leaf', 'sun', 'flame', 'heart',
]

export function sanitizeAvatar(value) {
  return typeof value === 'string' && AVATAR_IDS.includes(value) ? value : ''
}
