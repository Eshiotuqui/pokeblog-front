'use client';

import { useEffect } from 'react';
import { evento } from '../lib/analytics.ts';
import { BASE } from '../lib/base.ts';

/**
 * Conta a visita uma vez por aba do navegador (recarregar não infla o número), no contador do blog e no GA
 * (`ver_noticia`, com a categoria e se é notícia automática ou matéria).
 */
export function ContaVisita({ slug, categoria, tipo }: { slug: string; categoria: string; tipo: 'noticia' | 'materia' }) {
  useEffect(() => {
    const chave = `pokeblog:visto:${slug}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, '1');
    } catch { /* modo privado: conta mesmo assim */ }
    evento('ver_noticia', { slug, categoria, tipo });
    fetch(`${BASE}/api/posts/${encodeURIComponent(slug)}/visita`, { method: 'POST' }).catch(() => {});
  }, [slug, categoria, tipo]);
  return null;
}
