import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../components/JsonLd.tsx';
import { Lateral } from '../../../components/Lateral.tsx';
import { PostCard } from '../../../components/PostCard.tsx';
import { servidor, servidorOpcional, type Categoria, type Lista } from '../../../lib/api.ts';
import { ehLingua, textos } from '../../../lib/i18n.ts';
import { jsonLdDePagina, metaPagina } from '../../../lib/seo.ts';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!ehLingua(lang)) return {};
  const s = textos[lang].seo;
  const lista = await servidor<Lista>(`/posts?source=admin&limit=1`).catch(() => null);
  // Sem matéria publicada a página é vazia: fora da busca até haver conteúdo.
  return metaPagina({ lang, caminho: '/materias', titulo: s.materiasTitulo, descricao: s.materiasDescricao, noindex: !lista?.total });
}

export default async function Materias({ params }: Props) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const s = textos[lang].seo;
  const [lista, cats] = await Promise.all([
    servidor<Lista>(`/posts?source=admin&lang=${lang}&limit=24`).catch(() => null),
    servidorOpcional<{ categorias: Categoria[] }>('/categorias'),
  ]);
  const rotulo = (id: string) => cats?.categorias.find((c) => c.id === id)?.[lang] ?? id;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <JsonLd dados={jsonLdDePagina({ lang, caminho: '/materias', titulo: s.materiasTitulo, descricao: s.materiasDescricao, trilha: [[s.materiasH1, '/materias']], tipo: 'CollectionPage' })} />
      <div className="min-w-0 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">{s.materiasH1}</h1>
          <p className="mt-1 text-muted">{s.materiasSub}</p>
        </header>
        {!lista?.posts.length ? (
          <p className="card p-6 text-muted">{s.materiasVazio}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {lista.posts.map((p, i) => <PostCard key={p.id} post={p} lingua={lang} rotulo={rotulo(p.category)} indice={i} />)}
          </div>
        )}
      </div>
      <Lateral lingua={lang} />
    </div>
  );
}
