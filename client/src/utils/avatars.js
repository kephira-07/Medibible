import { FaPaw, FaDove, FaTree, FaFish, FaAnchor, FaStar, FaCrown, FaBookOpen, FaLeaf, FaSun, FaFire, FaHeart } from 'react-icons/fa'

// Doit rester synchronisé avec server/src/utils/avatars.js (liste blanche).
// Pictogrammes sobres sur fond de la palette MediBible.
export const AVATARS = [
  { id: 'paw', label: 'Empreinte', Icon: FaPaw, color: '#C1613C' },
  { id: 'dove', label: 'Colombe', Icon: FaDove, color: '#3F7FA6' },
  { id: 'tree', label: 'Arbre', Icon: FaTree, color: '#4C8B3E' },
  { id: 'fish', label: 'Poisson', Icon: FaFish, color: '#2F6F8F' },
  { id: 'anchor', label: 'Ancre', Icon: FaAnchor, color: '#3A2E22' },
  { id: 'star', label: 'Étoile', Icon: FaStar, color: '#D9924A' },
  { id: 'crown', label: 'Couronne', Icon: FaCrown, color: '#B8862F' },
  { id: 'book', label: 'Livre', Icon: FaBookOpen, color: '#006414' },
  { id: 'leaf', label: 'Feuille', Icon: FaLeaf, color: '#5E9C4B' },
  { id: 'sun', label: 'Soleil', Icon: FaSun, color: '#E0A030' },
  { id: 'flame', label: 'Flamme', Icon: FaFire, color: '#C1442C' },
  { id: 'heart', label: 'Cœur', Icon: FaHeart, color: '#A8404E' },
]

export function getAvatar(id) {
  return AVATARS.find((a) => a.id === id) || null
}
