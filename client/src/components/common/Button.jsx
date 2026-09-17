const VARIANTS = {
  primary:
    'bg-medi-green-deep text-white shadow-[0_12px_26px_rgba(11,94,69,0.32)] hover:bg-[#0a4f3a]',
  gold: 'bg-medi-gold text-medi-petrol shadow-[0_12px_26px_rgba(244,180,0,0.32)] hover:brightness-105',
  outline:
    'border-2 border-medi-border bg-white text-medi-petrol shadow-[0_8px_18px_rgba(22,50,62,0.06)] hover:border-medi-green-sage hover:bg-medi-green-sage/5',
  coral: 'bg-medi-coral text-white shadow-[0_12px_26px_rgba(255,107,91,0.32)] hover:brightness-105',
  sky: 'bg-medi-sky text-white shadow-[0_12px_26px_rgba(47,164,224,0.32)] hover:brightness-105',
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
