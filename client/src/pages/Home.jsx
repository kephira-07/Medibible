import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import BrandMark from '../components/common/BrandMark.jsx'
import FloatingBlobs from '../components/common/FloatingBlobs.jsx'

export default function Home() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-medi-cream px-4 py-10 text-center">
      <FloatingBlobs />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-[#dfe9e6] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,248,247,0.9))] p-6 shadow-[0_20px_55px_rgba(24,54,66,0.10)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-medi-sky/80 to-medi-green-sage/10 ring-1 ring-medi-green-deep/10 shadow-[0_12px_24px_rgba(31,79,93,0.10)]">
            <BrandMark className="animate-sway h-16 w-16" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-medi-green-deep/75">
              Quiz biblique en direct
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-medi-petrol sm:text-4xl">
              MediBible
            </h1>
            <p className="mt-2 text-sm leading-6 text-medi-petrol/70 sm:text-base">
              Quiz bibliques interactifs, chaleureux et immersifs.
            </p>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link to="/join" className="w-full">
            <Button className="w-full">Rejoindre un quiz</Button>
          </Link>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Espace admin
            </Button>
          </Link>
        </div>

      </div>
    </main>
  )
}
