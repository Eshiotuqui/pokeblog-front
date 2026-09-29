import type { ReactNode } from 'react';

/** Título de seção: barrinha na cor do tema, sem faixa nem caixa. */
export function Secao({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
        <span className="h-6 w-1.5 rounded-full bg-tema" aria-hidden="true" />{titulo}
      </h2>
      {children}
    </div>
  );
}

/** Cartão da barra lateral, com título pequeno e ícone opcional. */
export function Cartao({ titulo, icone, children, className = '' }: { titulo: string; icone?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={titulo} className={`card p-4 ${className}`}>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">{icone}{titulo}</h3>
      {children}
    </section>
  );
}
