'use client';

import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Categoria } from '../lib/api.ts';
import { textos, type Lingua } from '../lib/i18n.ts';

export function Filtros({ lingua, categorias }: { lingua: Lingua; categorias: Categoria[] }) {
  const t = textos[lingua].feed;
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const atual = params.get('category') ?? '';
  const ordem = params.get('sort') === 'ending' ? 'ending' : 'recent';
  const m = textos[lingua].materia;
  const [busca, setBusca] = useState(params.get('q') ?? '');
  const primeira = useRef(true);

  const ir = (mudar: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudar)) (v ? p.set(k, v) : p.delete(k));
    p.delete('page');
    const qs = p.toString();
    router.push(qs ? `${caminho}?${qs}` : caminho, { scroll: false });
  };

  // Espera parar de digitar antes de buscar.
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    const id = setTimeout(() => ir({ q: busca.trim() }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.buscar} aria-label={t.buscar} maxLength={80} className="campo pl-10" />
      </label>
      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label={m.ordem}>
        <span className="text-muted">{m.ordem}:</span>
        {(['recent', 'ending'] as const).map((o) => (
          <button key={o} aria-pressed={ordem === o} onClick={() => ir({ sort: o === 'recent' ? '' : o })}
            className={`rounded-full border px-3 py-1 font-semibold transition ${ordem === o ? 'border-tema text-tema' : 'border-line text-muted hover:text-ink'}`}>
            {o === 'recent' ? m.recentes : m.acabam}
          </button>
        ))}
      </div>
      <div className="sem-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" role="tablist">
        {[{ id: '', pt: t.todas, en: t.todas }, ...categorias].map((c) => {
          const ativo = atual === c.id;
          return (
            <button key={c.id || 'todas'} role="tab" aria-selected={ativo} onClick={() => ir({ category: c.id })}
              className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${ativo ? 'text-brand-ink' : 'bg-surface text-muted border border-line hover:text-ink'}`}>
              {ativo && <motion.span layoutId="chip" className="absolute inset-0 rounded-full bg-tema" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className={`relative ${ativo ? 'text-bg' : ''}`}>{c[lingua]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
