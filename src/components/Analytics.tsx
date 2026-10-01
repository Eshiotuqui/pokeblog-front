'use client';

import { useEffect } from 'react';
import { enviarPendentes, evento } from '../lib/analytics.ts';

/**
 * Google Analytics 4. Sem NEXT_PUBLIC_GA_ID no ambiente fica desligado (em
 * desenvolvimento nada é enviado). As trocas de página quem conta é o próprio
 * GA ("alterações de página com base em eventos do histórico", ligada por
 * padrão na medição otimizada): o Next navega com pushState, que ele acompanha.
 * O script só é baixado depois que a página terminou de abrir, para não
 * disputar rede com o conteúdo.
 */
const ID = (process.env.NEXT_PUBLIC_GA_ID ?? '').trim();

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

export function Analytics() {
  useEffect(() => {
    if (!ID || window.gtag) return;
    window.dataLayer = window.dataLayer ?? [];
    // O gtag espera o `arguments` original, não um array: é o formato que o script do Google lê da fila.
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
    // Grupo de conteúdo: no GA, o blog e o guia são o mesmo site (pokegoguide.com). Com isto, os relatórios de
    // páginas separam um do outro ("Grupo de conteúdo": blog ou guia). O `set` vale para todo evento da visita.
    window.gtag('set', { content_group: 'blog' });
    window.gtag('config', ID);
    enviarPendentes();
    const baixar = () => {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
      document.head.appendChild(s);
    };
    const ocioso = () => (window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1)))(baixar);
    if (document.readyState === 'complete') ocioso();
    else window.addEventListener('load', ocioso, { once: true });
  }, []);

  // Cliques em link marcado com `data-evento` (veja `rastreio` em lib/analytics.ts). Na captura, antes de a
  // página trocar; o gtag envia por beacon, que sobrevive à saída da página.
  useEffect(() => {
    if (!ID) return;
    const aoClicar = (e: MouseEvent) => {
      const alvo = (e.target as Element | null)?.closest?.<HTMLElement>('[data-evento]');
      if (!alvo) return;
      const { evento: nome, ...resto } = alvo.dataset;
      const parametros = Object.fromEntries(Object.entries(resto).map(([k, v]) => [k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`), v ?? '']));
      evento(nome!, { ...parametros, transport_type: 'beacon' });
    };
    document.addEventListener('click', aoClicar, true);
    return () => document.removeEventListener('click', aoClicar, true);
  }, []);
  return null;
}
