import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '../../../../components/JsonLd.tsx';
import { Lateral } from '../../../../components/Lateral.tsx';
import { PostCard } from '../../../../components/PostCard.tsx';
import { servidor, servidorOpcional, type Categoria, type Lista } from '../../../../lib/api.ts';
import { ehLingua, textos } from '../../../../lib/i18n.ts';
import { jsonLdDePagina, metaPagina } from '../../../../lib/seo.ts';

type Props = { params: Promise<{ lang: string; id: string }> };

async function categoriaDe(id: string, lang: 'pt' | 'en'): Promise<Categoria | null> {
  const r = await servidorOpcional<{ categorias: Categoria[] }>('/categorias');
  return r?.categorias.find((c) => c.id === id) ?? null;
}

const preencher = (modelo: string, cat: string) => modelo.replaceAll('{cat}', cat);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  if (!ehLingua(lang)) return {};
  const c = await categoriaDe(id, lang);
  if (!c) return {};
  const s = textos[lang].seo;
  return metaPagina({ lang, caminho: `/categoria/${id}`, titulo: preencher(s.categoriaTitulo, c[lang]), descricao: preencher(s.categoriaDescricao, c[lang]) });
}

/** Uma página por categoria (Dia Comunitário, Reides…): é por elas que a busca acha "notícias de reide Pokémon GO". */
export default async function Categoria({ params }: Props) {
  const { lang, id } = await params;
  if (!ehLingua(lang)) notFound();
  const c = await categoriaDe(id, lang);
  if (!c) notFound();
  const s = textos[lang].seo;
  const lista = await servidor<Lista>(`/posts?category=${encodeURIComponent(id)}&lang=${lang}&limit=30`).catch(() => null);
  const titulo = preencher(s.categoriaTitulo, c[lang]);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <JsonLd dados={jsonLdDePagina({ lang, caminho: `/categoria/${id}`, titulo, descricao: preencher(s.categoriaDescricao, c[lang]), trilha: [[c[lang], `/categoria/${id}`]], tipo: 'CollectionPage' })} />
      <div className="min-w-0 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">{c[lang]}</h1>
          <p className="mt-1 text-muted">{s.categoriaSub}</p>
        </header>
        {!lista?.posts.length ? (
          <p className="card p-6 text-muted">{s.semNoticias}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {lista.posts.map((p, i) => <PostCard key={p.id} post={p} lingua={lang} rotulo={c[lang]} indice={i} />)}
          </div>
        )}
        <Link href={`/${lang}`} className="botao-suave">{s.verTodas}</Link>
      </div>
      <Lateral lingua={lang} />
    </div>
  );
}
