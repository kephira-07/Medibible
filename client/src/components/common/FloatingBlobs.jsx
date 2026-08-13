// Décor de fond discret et animé — trois taches de couleur qui dérivent
// lentement, pour que le fond ne soit jamais complètement statique.
export default function FloatingBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="animate-float-slow absolute -left-12 top-8 h-40 w-40 rounded-full bg-medi-sky/20 blur-2xl" />
      <div className="animate-float-slower absolute -right-8 top-1/3 h-56 w-56 rounded-full bg-medi-coral/15 blur-2xl" />
      <div className="animate-float-slow absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-medi-gold/20 blur-2xl" />
    </div>
  )
}
