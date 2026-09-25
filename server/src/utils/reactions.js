// Doit rester synchronisé avec client/src/utils/reactions.js : le client
// n'envoie qu'un identifiant, jamais du texte libre.
export const REACTION_IDS = ['like', 'clap', 'heart', 'laugh', 'wow', 'pray', 'fire', 'sad', 'cry', 'think']

export function isValidReaction(value) {
  return typeof value === 'string' && REACTION_IDS.includes(value)
}
