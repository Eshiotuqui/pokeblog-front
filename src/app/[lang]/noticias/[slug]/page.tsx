import { ArrowLeft, CalendarDays, Clock, Eye, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContaVisita } from '../../../../components/ContaVisita.tsx';
import { Corpo } from '../../../../components/Corpo.tsx';
import { FavoritoBotao } from '../../../../components/FavoritoBotao.tsx';
import { Lateral } from '../../../../components/Lateral.tsx';
import { servidor, servidorOpcional, type Categoria, type Post } from '../../../../lib/api.ts';
import { dataDaPostagem, dataDoEvento, urlSegura } from '../../../../lib/formato.ts';
import { JsonLd } from '../../../../components/JsonLd.tsx';
import { ehLingua, textos } from '../../../../lib/i18n.ts';
import { NOME, jsonLdDoArtigo, metaPagina } from '../../../../lib/seo.ts';

type Props = { params: Promise<{ lang: string; slug: string }> };

/** "Nome | PokeGoGuide Blog": marca no título da aba e do resultado, sem passar de ~65 letras (o Google corta acima disso). */
const tituloDoArtigo = (t: string): string => {
  const com = `${t} | ${NOME}`;
  return com.length <= 65 ? com : t.length <= 65 ? t : `${t.slice(0, 62).trimEnd()}…`;
};

const buscar = (slug: string, lang: string) => servidor<{ post: Post }>(`/posts/${encodeURIComponent(slug)}?lang=${lang}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const r = ehLingua(lang) ? await buscar(slug, lang).catch(() => null) : null;
  if (!r) return { robots: { index: false, follow: false } };
  const { post } = r;
  // Página em português com texto ainda em inglês: o endereço "oficial" é o do idioma em que o texto existe.
  const donoDoTexto = post.lingua;
  const idiomas = post.langs.length ? post.langs : [donoDoTexto];
  return metaPagina({
    lang: donoDoTexto, caminho: `/noticias/${slug}`, titulo: tituloDoArtigo(post.title), descricao: post.summary || post.title,
    imagem: post.image, tipo: 'article', idiomas, publicadoEm: post.publishedAt, atualizadoEm: post.updatedAt,
    noindex: false,
  });
}

export default async function Noticia({ params }: Props) {
  const { lang, slug } = await params;
  if (!ehLingua(lang)) notFound();
  const [r, cats] = await Promise.all([buscar(slug, lang), servidorOpcional<{ categorias: Categoria[] }>('/categorias')]);
  if (!r) notFound();
  const { post } = r;
  const t = textos[lang];
  const rotulo = cats?.categorias.find((c) => c.id === post.category)?.[lang] ?? post.category;
  const imagem = urlSegura(post.image);
  const link = urlSegura(post.link);
  const inicio = dataDoEvento(post.eventStart, lang);
  const fim = dataDoEvento(post.eventEnd, lang);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ContaVisita slug={post.slug} />
      <JsonLd dados={jsonLdDoArtigo(post, lang, rotulo, post.category)} />
      <article className="min-w-0 space-y-6">
        <Link href={`/${lang}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} />{t.post.voltar}</Link>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.source === 'admin' && <span className="rounded-full bg-tema px-3 py-1 text-xs font-bold uppercase tracking-wide text-bg">{t.seo.materiaBadge}</span>}
            <Link href={`/${lang}/categoria/${post.category}`} className="rounded-full bg-highlight px-3 py-1 text-xs font-bold text-tema hover:underline">{rotulo}</Link>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-tema" />{dataDaPostagem(post.publishedAt, lang)}</span>
            <span>{post.source === 'auto' ? t.post.automatica : t.post.manual}</span>
            {post.views > 0 && <span className="flex items-center gap-1.5"><Eye size={15} />{post.views} {t.lateral.visualizacoes}</span>}
          </p>
          {post.lingua !== lang && post.source === 'admin' && <p className="rounded-lg bg-highlight px-3 py-2 text-sm text-muted">{t.post.outraLingua}</p>}
        </header>

        {imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt="" className="aspect-[2/1] w-full rounded-3xl border border-line object-cover" />
        )}

        {(inicio || fim) && (
          <div className="card flex items-start gap-3 p-4">
            <Clock className="mt-0.5 text-tema" size={20} />
            <dl className="text-sm">
              {inicio && <div><dt className="inline font-semibold">{t.post.inicio}: </dt><dd className="inline">{inicio}</dd></div>}
              {fim && <div><dt className="inline font-semibold">{t.post.fim}: </dt><dd className="inline">{fim}</dd></div>}
              <p className="mt-1 text-xs text-muted">{t.post.horaLocal}</p>
            </dl>
          </div>
        )}

        {post.summary && !post.body?.includes(post.summary.slice(0, 60)) && <p className="text-xl font-medium leading-relaxed text-muted">{post.summary}</p>}
        {post.body && <Corpo texto={post.body} rotuloShiny={t.lateral.shiny} t={t.materia} />}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <FavoritoBotao slug={post.slug} inicial={post.favorito} lingua={lang} />
          {link && <a href={link} target="_blank" rel="noopener noreferrer" className="botao-suave"><ExternalLink size={16} />{t.post.fonte}</a>}
          {post.source === 'auto' && link && <p className="basis-full text-xs text-muted">{lang === 'pt' ? 'Informações do evento reunidas a partir do LeekDuck.' : 'Event information gathered from LeekDuck.'}</p>}
        </div>
      </article>
      <Lateral lingua={lang} />
    </div>
  );
}
