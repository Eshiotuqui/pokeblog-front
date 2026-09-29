import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Mosaico } from '../../components/Mosaico.tsx';
import { Filtros } from '../../components/Filtros.tsx';
import { Lateral } from '../../components/Lateral.tsx';
import { PostCard } from '../../components/PostCard.tsx';
import { Secao } from '../../components/Secao.tsx';
import { servidor, servidorOpcional, type Categoria, type Lista } from '../../lib/api.ts';
import { JsonLd } from '../../components/JsonLd.tsx';
import { ehLingua, textos } from '../../lib/i18n.ts';
import { jsonLdDePagina, metaPagina } from '../../lib/seo.ts';

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string; q?: string; page?: string; sort?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!ehLingua(lang)) return {};
  const sp = await searchParams;
  const s = textos[lang].seo;
  // Busca, ordem e páginas seguintes repetem conteúdo da página principal: ficam fora da busca (o canonical aponta para a principal).
  return metaPagina({ lang, caminho: '', titulo: s.inicioTitulo, descricao: s.inicioDescricao, noindex: !!(sp.q || sp.sort || (sp.page && sp.page !== '1')) });
}

export default async function Inicio({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const sp = await searchParams;
  const t = textos[lang];

  const qs = new URLSearchParams({ lang, limit: '11' });
  if (sp.category) qs.set('category', sp.category);
  if (sp.q) qs.set('q', sp.q);
  if (sp.page) qs.set('page', sp.page);
  const acabando = sp.sort === 'ending';
  if (acabando) qs.set('sort', 'ending');
  let fora = false;
  const [lista, cats] = await Promise.all([
    servidor<Lista>(`/posts?${qs}`).catch(() => { fora = true; return null; }),
    servidorOpcional<{ categorias: Categoria[] }>('/categorias'),
  ]);
  const categorias = cats?.categorias ?? [];
  const rotulo = (id: string) => categorias.find((c) => c.id === id)?.[lang] ?? id;

  const pagina = lista?.page ?? 1;
  const filtrando = !!(sp.category || sp.q || acabando);
  const posts = lista?.posts ?? [];
  // A abertura (1 grande + 2 menores) só na primeira página sem filtro: as mais recentes com imagem.
  const destaques = pagina === 1 && !filtrando ? posts.filter((p) => p.image).slice(0, 3) : [];
  const usados = new Set(destaques.map((p) => p.id));
  const resto = posts.filter((p) => !usados.has(p.id));

  const irPara = (n: number) => {
    const p = new URLSearchParams();
    if (sp.category) p.set('category', sp.category);
    if (sp.q) p.set('q', sp.q);
    if (acabando) p.set('sort', 'ending');
    if (n > 1) p.set('page', String(n));
    const s = p.toString();
    return `/${lang}${s ? `?${s}` : ''}`;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <JsonLd dados={jsonLdDePagina({ lang, caminho: '', titulo: t.seo.inicioTitulo, descricao: t.seo.inicioDescricao, tipo: 'CollectionPage' })} />
      <div className="min-w-0 space-y-8">
        {fora && <p role="alert" className="card border-danger/40 p-4 text-sm">{t.feed.instavel}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.seo.inicioTitulo.split(' | ')[0]}</h1>
        <Suspense fallback={<div className="esqueleto h-24" />}><Filtros lingua={lang} categorias={categorias} /></Suspense>

        {destaques.length === 3 && <Mosaico posts={destaques} lingua={lang} rotulos={Object.fromEntries(categorias.map((c) => [c.id, c[lang]]))} />}

        <section aria-label={t.lateral.ultimos} className="space-y-6">
          <Secao titulo={t.lateral.ultimos} />
          {!resto.length ? (
            !fora && <p className="card p-6 text-muted">{t.feed.vazio}</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {resto.map((p, i) => <PostCard key={p.id} post={p} lingua={lang} rotulo={rotulo(p.category)} indice={i} mostrarFim={acabando} />)}
            </div>
          )}
        </section>

        {lista && lista.pages > 1 && (
          <nav className="flex items-center justify-center gap-3" aria-label="paginação">
            {pagina > 1 && <Link href={irPara(pagina - 1)} className="botao-suave">{t.feed.anterior}</Link>}
            <span className="text-sm text-muted">{t.feed.pagina} {pagina}/{lista.pages}</span>
            {pagina < lista.pages && <Link href={irPara(pagina + 1)} className="botao-suave">{t.feed.proxima}</Link>}
          </nav>
        )}
      </div>
      <Lateral lingua={lang} />
    </div>
  );
}
