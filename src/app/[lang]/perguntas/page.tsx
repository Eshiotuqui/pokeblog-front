import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../components/JsonLd.tsx';
import { Lateral } from '../../../components/Lateral.tsx';
import { PERGUNTAS } from '../../../lib/faq.ts';
import { ehLingua, textos } from '../../../lib/i18n.ts';
import { jsonLdDePagina, metaPagina } from '../../../lib/seo.ts';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!ehLingua(lang)) return {};
  const s = textos[lang].seo;
  return metaPagina({ lang, caminho: '/perguntas', titulo: s.perguntasTitulo, descricao: s.perguntasDescricao });
}

export default async function Perguntas({ params }: Props) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const s = textos[lang].seo;
  const faq = PERGUNTAS[lang];
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* As perguntas do JSON-LD são as mesmas que aparecem na página (regra do Google para FAQ). */}
      <JsonLd dados={jsonLdDePagina({ lang, caminho: '/perguntas', titulo: s.perguntasTitulo, descricao: s.perguntasDescricao, trilha: [[s.perguntasH1, '/perguntas']], faq, tipo: 'FAQPage' })} />
      <div className="min-w-0 space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{s.perguntasH1}</h1>
        <div className="space-y-3">
          {faq.map((q) => (
            <details key={q.pergunta} className="card group p-4 open:border-tema">
              <summary className="cursor-pointer list-none font-bold marker:hidden">
                <h2 className="inline text-base">{q.pergunta}</h2>
              </summary>
              <p className="mt-2 leading-relaxed text-muted">{q.resposta}</p>
            </details>
          ))}
        </div>
      </div>
      <Lateral lingua={lang} />
    </div>
  );
}
