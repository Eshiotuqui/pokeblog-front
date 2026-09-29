/** A Pokébola do PokeGoGuide (versão clássica, em SVG). */
export function Pokebola({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#fff" stroke="#1d2027" strokeWidth="2" />
      <path d="M2 16a14 14 0 0 1 28 0z" fill="#d32f2f" stroke="#1d2027" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 16h28" stroke="#1d2027" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="4.5" fill="#fff" stroke="#1d2027" strokeWidth="2.5" />
    </svg>
  );
}
