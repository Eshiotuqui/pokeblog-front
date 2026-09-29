'use client';

import { useEffect } from 'react';

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
    window.gtag('config', ID);
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
  return null;
}
