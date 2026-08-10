const VARIANTS = {
  primary: 'bg-medi-green-sage text-white shadow-medi-green-sage/30 hover:bg-medi-green-deep',
  gold: 'bg-medi-gold text-medi-petrol shadow-medi-gold/40 hover:brightness-105',
  outline:
    'border-2 border-medi-green-sage text-medi-green-deep hover:bg-medi-green-sage/10 shadow-none',
  coral: 'bg-medi-coral text-white shadow-medi-coral/40 hover:brightness-105',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`min-h-12 rounded-2xl px-6 font-bold shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
