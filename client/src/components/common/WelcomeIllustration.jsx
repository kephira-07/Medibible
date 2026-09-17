// Illustration 2D d'accueil pour le joueur : deux silhouettes autour d'un
// livre ouvert, dans la palette chaleureuse de la charte — pas de photo, pas
// de dépendance externe, juste du SVG inline pour rester léger.
export default function WelcomeIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="146" rx="78" ry="10" fill="#EFDCC3" opacity="0.6" />

      {/* Livre ouvert */}
      <path d="M100 100 60 92v40l40 8 40-8V92z" fill="#FFFDF8" stroke="#EFDCC3" strokeWidth="2.5" />
      <path d="M100 100v40" stroke="#EFDCC3" strokeWidth="2.5" />
      <path d="M68 98l24 5M68 108l24 5M68 118l24 5" stroke="#D9924A" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path d="M132 98l-24 5M132 108l-24 5M132 118l-24 5" stroke="#D9924A" strokeWidth="2" strokeLinecap="round" opacity="0.55" />

      {/* Personnage gauche */}
      <circle cx="62" cy="58" r="16" fill="#C1613C" />
      <path d="M40 100c2-16 10-26 22-26s20 10 22 26" fill="#4C8B3E" />

      {/* Personnage droit */}
      <circle cx="140" cy="54" r="16" fill="#8B6F4E" />
      <path d="M118 100c2-17 10-28 22-28s20 11 22 28" fill="#006414" />

      {/* Petit cœur / étoile flottante pour la chaleur communautaire */}
      <path
        d="M100 34c3-6 12-6 12 2 0 6-8 10-12 14-4-4-12-8-12-14 0-8 9-8 12-2z"
        fill="#D9924A"
      />
    </svg>
  )
}
