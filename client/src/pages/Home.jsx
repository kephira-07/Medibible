import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import BrandMark from '../components/common/BrandMark.jsx'
import FloatingBlobs from '../components/common/FloatingBlobs.jsx'

export default function Home() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-medi-cream px-4 py-10 text-center">
      <FloatingBlobs />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-[#d9ceb3] bg-[#faf5ee]/95 p-6 shadow-[0_22px_52px_rgba(26,43,50,0.08)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d9ceb3] bg-[#f2e8d7] shadow-[0_12px_26px_rgba(26,43,50,0.06)]">
            <BrandMark className="animate-sway h-16 w-16" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-medi-green-deep/80">
              Quiz biblique en direct
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-medi-petrol sm:text-4xl">
              MediBible
            </h1>
            <p className="mt-2 text-sm leading-6 text-medi-petrol/70 sm:text-base">
              Des échanges bibliques plus réfléchis, plus sereins et plus vivants.
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
