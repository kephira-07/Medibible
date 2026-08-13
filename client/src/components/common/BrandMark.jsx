// Emblème abstrait MediBible : un arbre aux branches entrelacées sortant
// d'un livre ouvert, sur un cercle évoquant le globe — dérivé de la charte.
export default function BrandMark({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="21" stroke="#1D5A68" strokeWidth="2" />
      <path
        d="M13 31c4.5-2.2 6.9-2.2 11 0s6.5 2.2 11 0"
        stroke="#C69214"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 31V15" stroke="#0F323D" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M24 19c-3-3-7-3-9-1M24 19c3-3 7-3 9-1M24 23.5c-4-3-8-2-10.5.5M24 23.5c4-3 8-2 10.5.5"
        stroke="#0F323D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
