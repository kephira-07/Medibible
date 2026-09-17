const VARIANTS = {
  primary:
    'bg-medi-green-deep text-white shadow-[0_12px_26px_rgba(0,100,20,0.30)] hover:bg-[#004d0f]',
  gold: 'bg-medi-gold text-medi-petrol shadow-[0_12px_26px_rgba(217,146,74,0.35)] hover:brightness-105',
  outline:
    'border-2 border-medi-border bg-white text-medi-petrol shadow-[0_8px_18px_rgba(58,46,34,0.06)] hover:border-medi-green-sage hover:bg-medi-green-sage/5',
  coral: 'bg-medi-coral text-white shadow-[0_12px_26px_rgba(193,97,60,0.32)] hover:brightness-105',
  sky: 'bg-medi-sky text-white shadow-[0_12px_26px_rgba(139,111,78,0.32)] hover:brightness-105',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`min-h-12 rounded-lg px-5 font-bold tracking-[0.01em] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
