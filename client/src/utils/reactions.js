// Doit rester synchronisé avec server/src/utils/reactions.js (liste blanche).
export const REACTIONS = [
  { id: 'like', emoji: '👍', label: "J'approuve" },
  { id: 'clap', emoji: '👏', label: 'Bravo' },
  { id: 'heart', emoji: '❤️', label: "J'adore" },
  { id: 'laugh', emoji: '😂', label: 'Ça me fait rire' },
  { id: 'wow', emoji: '😮', label: 'Surpris' },
  { id: 'pray', emoji: '🙏', label: 'Merci / Prière' },
  { id: 'fire', emoji: '🔥', label: 'Super' },
  { id: 'sad', emoji: '😢', label: 'Triste' },
  { id: 'cry', emoji: '😭', label: 'Très triste' },
  { id: 'think', emoji: '🤔', label: 'Je réfléchis' },
]

export function getReactionEmoji(id) {
  return REACTIONS.find((r) => r.id === id)?.emoji || null
}
