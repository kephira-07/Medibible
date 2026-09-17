import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import BrandMark from '../components/common/BrandMark.jsx'
import FloatingBlobs from '../components/common/FloatingBlobs.jsx'

export default function Home() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-medi-cream px-4 py-10 text-center">
      <FloatingBlobs />

      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-6 shadow-[0_22px_52px_rgba(22,50,62,0.1)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-medi-gold/40 bg-gradient-to-br from-medi-gold-light/40 to-medi-sky/10 shadow-[0_14px_30px_rgba(217,146,74,0.20)]">
            <BrandMark className="animate-sway h-16 w-16" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-medi-green-deep">
              Quiz biblique en direct
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-medi-petrol sm:text-5xl">
              MediBible
            </h1>
            <p className="mt-2 text-sm leading-6 text-medi-petrol/70 sm:text-base">
              Des quiz bibliques vivants, à jouer ensemble, en direct.
            </p>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link to="/join" className="w-full">
            <Button variant="coral" className="w-full text-base">
              Rejoindre un quiz
            </Button>
          </Link>
        </div>

        <Link
          to="/login"
          className="mt-5 inline-block text-xs font-semibold text-medi-petrol/45 underline-offset-2 transition hover:text-medi-petrol/70 hover:underline"
        >
          Espace animateur
        </Link>
      </div>
    </main>
  )
}
