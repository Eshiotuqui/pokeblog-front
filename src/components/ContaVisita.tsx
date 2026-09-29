'use client';

import { useEffect } from 'react';

/** Conta a visita uma vez por aba do navegador (recarregar não infla o número). */
export function ContaVisita({ slug }: { slug: string }) {
  useEffect(() => {
    const chave = `pokeblog:visto:${slug}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, '1');
    } catch { /* modo privado: conta mesmo assim */ }
    fetch(`/api/posts/${encodeURIComponent(slug)}/visita`, { method: 'POST' }).catch(() => {});
  }, [slug]);
  return null;
}
