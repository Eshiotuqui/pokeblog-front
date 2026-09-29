'use client';

import { useParams } from 'next/navigation';
import { textos, ehLingua } from '../../lib/i18n.ts';

/** Erro inesperado (por exemplo, a API fora do ar): aviso claro e botão para tentar de novo. */
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const t = textos[ehLingua(lang) ? lang : 'pt'];
  return (
    <div className="card mx-auto max-w-md space-y-4 p-8 text-center">
      <p role="alert" className="font-medium">{t.feed.instavel}</p>
      <button onClick={reset} className="botao">{t.feed.tentar}</button>
    </div>
  );
}
