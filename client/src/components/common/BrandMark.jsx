// Emblème MediBible — client/public/logo.jpeg. S'affiche automatiquement
// partout où <BrandMark /> est utilisé (accueil, connexion, en-têtes), à la
// bonne taille à chaque endroit. Si le fichier venait à manquer (404), le
// logo SVG généré précédemment reste affiché en repli.
export default function BrandMark({ className = 'h-10 w-10' }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <FallbackMark className="absolute inset-0 h-full w-full" />
      <img
        src="/logo.jpeg"
        alt="MediBible"
        className="absolute inset-0 h-full w-full rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </span>
  )
}

// Repli affiché en dessous du <img> — reste invisible dès que /logo.jpeg se
// charge avec succès (il recouvre alors ce SVG), retiré automatiquement de
// la vue si le fichier est absent puisque l'image casse et disparaît.
function FallbackMark({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="21" stroke="#006414" strokeWidth="2.5" />
      <path
        d="M13 31c4.5-2.2 6.9-2.2 11 0s6.5 2.2 11 0"
        stroke="#D9924A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M24 31V15" stroke="#3A2E22" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M24 19c-3-3-7-3-9-1M24 19c3-3 7-3 9-1M24 23.5c-4-3-8-2-10.5.5M24 23.5c4-3 8-2 10.5.5"
        stroke="#4C8B3E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
