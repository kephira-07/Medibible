const VARIANTS = {
  primary:
    'bg-medi-green-deep text-white shadow-[0_10px_30px_rgba(29,90,104,0.22)] hover:bg-[#173f4b]',
  gold: 'bg-medi-gold text-medi-petrol shadow-[0_10px_24px_rgba(198,146,20,0.22)] hover:brightness-105',
  outline:
    'border border-medi-green-deep/20 bg-white/80 text-medi-petrol shadow-[0_8px_20px_rgba(15,50,61,0.05)] hover:bg-medi-green-deep/5',
  coral: 'bg-medi-coral text-white shadow-[0_10px_24px_rgba(91,140,90,0.18)] hover:brightness-105',
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
