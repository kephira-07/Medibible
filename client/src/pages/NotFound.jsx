import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import FloatingBlobs from '../components/common/FloatingBlobs.jsx'

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-medi-cream px-4 py-10 text-center">
      <FloatingBlobs />
      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-8 shadow-[0_22px_52px_rgba(22,50,62,0.1)]">
        <p className="text-6xl">🧭</p>
        <h1 className="mt-4 text-3xl font-extrabold text-medi-petrol">Page introuvable</h1>
        <p className="mt-2 text-sm text-medi-petrol/60">
          Ce lien ne mène à rien ici — vérifie le code de session ou reviens à l'accueil.
        </p>
        <Link to="/" className="mt-6 inline-block w-full">
          <Button variant="primary" className="w-full">Retour à l'accueil</Button>
        </Link>
      </div>
    </main>
  )
}
