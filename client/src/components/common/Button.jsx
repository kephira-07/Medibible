const VARIANTS = {
  primary:
    'bg-gradient-to-r from-medi-green-deep via-[#2b6473] to-medi-green-sage text-white shadow-[0_12px_28px_rgba(31,79,93,0.22)] hover:brightness-110',
  gold: 'bg-gradient-to-r from-[#e8bf6d] to-medi-gold text-medi-petrol shadow-[0_12px_28px_rgba(217,168,78,0.25)] hover:brightness-105',
  outline:
    'border border-[#dfe8e6] bg-white/90 text-medi-petrol shadow-[0_10px_24px_rgba(24,54,66,0.06)] hover:border-medi-green-sage/60 hover:bg-[#f2f9f7]',
  coral: 'bg-gradient-to-r from-[#d68f7a] to-medi-coral text-white shadow-[0_12px_28px_rgba(199,123,93,0.22)] hover:brightness-105',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`min-h-12 rounded-2xl px-5 font-semibold tracking-[0.01em] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
