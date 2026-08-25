const VARIANTS = {
  primary:
    'bg-[#1f2f39] text-white shadow-[0_12px_26px_rgba(31,47,57,0.18)] hover:bg-[#182b34]',
  gold: 'bg-[#c9a569] text-[#1a2b32] shadow-[0_12px_26px_rgba(201,165,105,0.24)] hover:brightness-105',
  outline:
    'border border-[#d8cdb3] bg-[#f9f3e8] text-medi-petrol shadow-[0_10px_20px_rgba(26,43,50,0.04)] hover:bg-[#f1e8d8]',
  coral: 'bg-[#8c6b58] text-white shadow-[0_12px_26px_rgba(140,107,88,0.18)] hover:brightness-105',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`min-h-12 rounded-2xl px-5 font-semibold tracking-[0.02em] transition-all duration-160 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
