const VARIANTS = {
  primary:
    'bg-medi-green-deep text-white shadow-[0_10px_24px_rgba(26,45,54,0.18)] hover:bg-[#152d36]',
  gold: 'bg-medi-gold text-medi-petrol shadow-[0_10px_24px_rgba(200,169,108,0.24)] hover:brightness-105',
  outline:
    'border border-[#d7d0c4] bg-[#f9f5ee] text-medi-petrol shadow-[0_8px_18px_rgba(29,43,50,0.04)] hover:bg-[#f2eadb]',
  coral: 'bg-medi-coral text-white shadow-[0_10px_24px_rgba(139,107,85,0.18)] hover:brightness-105',
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
