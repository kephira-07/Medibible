// Alphabet sans caractères ambigus à l'oral/à l'écran (pas de I, O, 0, 1)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateAccessCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}
