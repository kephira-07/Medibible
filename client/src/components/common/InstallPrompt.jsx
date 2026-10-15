import { useEffect, useState } from 'react'
import { FiDownload, FiX } from 'react-icons/fi'
import Button from './Button.jsx'
import BrandMark from './BrandMark.jsx'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (isStandalone()) return undefined

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }
    const handleAppInstalled = () => {
      setVisible(false)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // iOS does not expose beforeinstallprompt, so it needs a manual instruction.
    if (isIos()) setVisible(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (!visible) return null

  const install = async () => {
    if (!installEvent) {
      setShowInstructions(true)
      return
    }

    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setVisible(false)
    setInstallEvent(null)
  }

  return (
    <aside
      className="mt-6 rounded-2xl border-2 border-medi-gold/45 bg-medi-gold-light/25 p-4 text-left shadow-[0_12px_28px_rgba(217,146,74,0.14)]"
      aria-label="Installation de MediBible"
    >
      <div className="flex items-start gap-3">
        <BrandMark className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-medi-petrol">Installez MediBible</p>
          <p className="mt-1 text-sm leading-5 text-medi-petrol/75">
            Ajoutez l’application à votre écran d’accueil pour la retrouver rapidement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 text-medi-petrol/55 transition hover:bg-white/60 hover:text-medi-petrol"
          aria-label="Fermer le message d’installation"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>

      {showInstructions && (
        <p className="mt-3 rounded-lg bg-white/65 p-3 text-xs leading-5 text-medi-petrol/80">
          {isIos()
            ? 'Sur iPhone ou iPad : touchez Partager, puis « Sur l’écran d’accueil ».'
            : 'Ouvrez le menu de votre navigateur, puis choisissez « Installer MediBible » ou « Ajouter à l’écran d’accueil ».'
          }
        </p>
      )}

      <Button
        type="button"
        variant="gold"
        className="mt-3 flex w-full items-center justify-center gap-2"
        onClick={install}
      >
        <FiDownload aria-hidden="true" />
        Télécharger l’application
      </Button>
    </aside>
  )
}
