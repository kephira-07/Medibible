// Boîte de confirmation générique — utilisée pour bloquer une sortie
// accidentelle (ex : clic sur le logo pendant une partie en direct).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-medi-petrol/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="animate-pop-in w-full max-w-sm rounded-2xl border-2 border-medi-border bg-medi-surface p-6 text-center shadow-[0_24px_60px_rgba(22,50,62,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-medi-petrol">{title}</h3>
        {message && <p className="mt-2 text-sm text-medi-petrol/65">{message}</p>}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-medi-border bg-white py-2.5 text-sm font-bold text-medi-petrol transition hover:bg-medi-cream"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-medi-coral py-2.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
