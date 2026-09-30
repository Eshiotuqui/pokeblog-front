/**
 * O que o blog diz de si para a busca: endereço, metadados por página, JSON-LD,
 * robots e llms.txt. Tudo sai daqui, para o sitemap, o robots e as páginas
 * concordarem entre si.
 */
import type { Metadata } from 'next';
import type { Post } from './api.ts';
import { BASE } from './base.ts';
import { textos, type Lingua } from './i18n.ts';

export const NOME = 'PokeGoGuide Blog';
export const MARCA = 'PokeGoGuide';
export const NOMES_ALTERNATIVOS = ['PokeGoGuide Blog', 'Poke Go Guide Blog', 'blog do PokeGoGuide'];

/** Força HTTPS (menos em localhost) e tira a barra do fim. */
export function normalizarSite(bruto: string): string {
  const limpo = bruto.trim().replace(/\/+$/, '');
  if (!limpo) return '';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(limpo)) return limpo;
  // Canonical em http manda o rastreador para a versão insegura: dois pulos e um sinal trocado.
  return limpo.replace(/^http:\/\//i, 'https://').replace(/^(?!https?:\/\/)/i, 'https://');
}

/**
 * O endereço público do blog, já com o `/blog`. Em produção defina
 * NEXT_PUBLIC_SITE_URL (`https://pokegoguide.com/blog`); se vier só o
 * domínio, o `/blog` entra aqui.
 */
const comBase = (site: string): string => (site && !site.endsWith(BASE) ? `${site}${BASE}` : site);
export const SITE = comBase(
  normalizarSite(process.env.NEXT_PUBLIC_SITE_URL ?? '') ||
  normalizarSite(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '') ||
  'http://localhost:3000',
);

/** O app principal (PokeGoGuide), com quem o blog se liga. */
export const SITE_PRINCIPAL = normalizarSite(process.env.NEXT_PUBLIC_MAIN_SITE ?? '') || 'https://pokegoguide.com';

/** Cartão de compartilhamento: 1200×630 é a proporção do `summary_large_image`. */
export const CAPA = { arquivo: 'og-image.png', largura: 1200, altura: 630 };
export const LOGO = { arquivo: 'icon-512.png', tamanho: 512 };

export const urlDe = (lang: Lingua, caminho = ''): string => `${SITE}/${lang}${caminho}`;
export const localeDe = (lang: Lingua): string => (lang === 'pt' ? 'pt_BR' : 'en_US');
const hreflang = (lang: Lingua): string => (lang === 'pt' ? 'pt-BR' : 'en');

const imagemPadrao = (lang: Lingua) => ({
  url: `${SITE}/${CAPA.arquivo}`, width: CAPA.largura, height: CAPA.altura, type: 'image/png', alt: textos[lang].titulo,
});

interface Opcoes {
  lang: Lingua;
  /** Caminho sem o idioma: '' (início), '/materias', '/noticias/slug'. */
  caminho: string;
  titulo: string;
  descricao: string;
  imagem?: string | null;
  tipo?: 'website' | 'article';
  /** Idiomas em que a página existe de verdade. Só esses ganham hreflang. */
  idiomas?: Lingua[];
  noindex?: boolean;
  publicadoEm?: string;
  atualizadoEm?: string;
  secao?: string;
}

/**
 * Título, descrição, canonical, hreflang, Open Graph e Twitter de uma página.
 * O título é absoluto (já vem completo): o modelo "… | PokeGoGuide Blog" fica
 * para quem quiser, e assim a gente controla o comprimento (até ~60 letras).
 */
export function metaPagina(o: Opcoes): Metadata {
  const idiomas = o.idiomas ?? (['pt', 'en'] as Lingua[]);
  const url = urlDe(o.lang, o.caminho);
  const languages: Record<string, string> = Object.fromEntries(idiomas.map((l) => [hreflang(l), urlDe(l, o.caminho)]));
  if (idiomas.length) languages['x-default'] = urlDe(idiomas.includes('pt') ? 'pt' : idiomas[0]!, o.caminho);
  const imagem = o.imagem && /^https?:\/\//.test(o.imagem)
    ? { url: o.imagem, alt: o.titulo }
    : imagemPadrao(o.lang);
  return {
    title: { absolute: o.titulo },
    description: o.descricao,
    alternates: { canonical: url, languages, types: { 'application/rss+xml': urlDe(o.lang, '/feed.xml') } },
    robots: o.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph: {
      type: o.tipo ?? 'website', siteName: NOME, title: o.titulo, description: o.descricao, url,
      locale: localeDe(o.lang), alternateLocale: idiomas.filter((l) => l !== o.lang).map(localeDe),
      images: [imagem],
      ...(o.tipo === 'article'
        ? { publishedTime: o.publicadoEm, modifiedTime: o.atualizadoEm, section: o.secao, authors: [MARCA] }
        : {}),
    },
    twitter: { card: 'summary_large_image', title: o.titulo, description: o.descricao, images: [imagem.url] },
  };
}

// --- JSON-LD ---------------------------------------------------------------

const noSite = (lang: Lingua) => ({
  '@type': 'Blog', '@id': `${SITE}/#blog`, url: `${SITE}/${lang}`, name: NOME, alternateName: NOMES_ALTERNATIVOS,
  description: textos[lang].descricao, inLanguage: ['pt-BR', 'en'], publisher: { '@id': `${SITE}/#marca` },
});
const noMarca = () => ({
  '@type': 'Organization', '@id': `${SITE}/#marca`, name: MARCA, alternateName: NOMES_ALTERNATIVOS, url: SITE_PRINCIPAL,
  logo: { '@type': 'ImageObject', url: `${SITE}/${LOGO.arquivo}`, width: LOGO.tamanho, height: LOGO.tamanho },
});
const noWebSite = (lang: Lingua) => ({
  '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: NOME, alternateName: NOMES_ALTERNATIVOS,
  inLanguage: ['pt-BR', 'en'], publisher: { '@id': `${SITE}/#marca` },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/${lang}?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
});

const trilhaLd = (url: string, itens: [string, string][]) => ({
  '@type': 'BreadcrumbList', '@id': `${url}#caminho`,
  itemListElement: itens.map(([nome, item], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item })),
});

export interface Pergunta { pergunta: string; resposta: string }

/** JSON-LD de uma página comum (início, lista, perguntas): site, marca, página e trilha (e FAQ, se houver). */
export function jsonLdDePagina(p: {
  lang: Lingua; caminho: string; titulo: string; descricao: string;
  /** Os passos depois do início: [['Matérias', '/materias']]. */
  trilha?: [string, string][]; faq?: Pergunta[]; tipo?: 'WebPage' | 'CollectionPage' | 'FAQPage' | 'AboutPage';
}): unknown {
  const url = urlDe(p.lang, p.caminho);
  const trilha: [string, string][] = [[NOME, urlDe(p.lang)], ...(p.trilha ?? []).map(([n, c]): [string, string] => [n, urlDe(p.lang, c)])];
  const grafo: unknown[] = [
    noWebSite(p.lang), noMarca(), noSite(p.lang),
    {
      '@type': p.tipo ?? 'WebPage', '@id': `${url}#pagina`, url, name: p.titulo, description: p.descricao,
      isPartOf: { '@id': `${SITE}/#site` }, inLanguage: hreflang(p.lang), breadcrumb: { '@id': `${url}#caminho` },
      primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/${CAPA.arquivo}`, width: CAPA.largura, height: CAPA.altura },
    },
    trilhaLd(url, trilha),
  ];
  if (p.faq?.length) {
    grafo.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: p.faq.map((q) => ({ '@type': 'Question', name: q.pergunta, acceptedAnswer: { '@type': 'Answer', text: q.resposta } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': grafo };
}

/**
 * JSON-LD de uma notícia ou matéria. Matéria do admin é `BlogPosting`; notícia
 * automática é `NewsArticle`, com a fonte em `isBasedOn`.
 */
export function jsonLdDoArtigo(post: Post, lang: Lingua, rotuloCategoria: string, categoriaId: string): unknown {
  const url = urlDe(lang, `/noticias/${post.slug}`);
  const imagens = post.image && /^https?:\/\//.test(post.image) ? [post.image] : [`${SITE}/${CAPA.arquivo}`];
  const artigo = {
    '@type': post.source === 'admin' ? 'BlogPosting' : 'NewsArticle', '@id': `${url}#artigo`,
    mainEntityOfPage: { '@id': `${url}#pagina` }, headline: post.title.slice(0, 110), description: post.summary,
    image: imagens, datePublished: post.publishedAt, dateModified: post.updatedAt, inLanguage: hreflang(post.lingua),
    articleSection: rotuloCategoria, author: { '@id': `${SITE}/#marca` }, publisher: { '@id': `${SITE}/#marca` },
    isPartOf: { '@id': `${SITE}/#blog` },
    ...(post.source === 'auto' && post.link ? { isBasedOn: post.link } : {}),
  };
  const grafo = [
    noWebSite(lang), noMarca(), noSite(lang),
    {
      '@type': 'WebPage', '@id': `${url}#pagina`, url, name: post.title, description: post.summary, inLanguage: hreflang(post.lingua),
      isPartOf: { '@id': `${SITE}/#site` }, breadcrumb: { '@id': `${url}#caminho` }, primaryImageOfPage: { '@type': 'ImageObject', url: imagens[0] },
    },
    artigo,
    trilhaLd(url, [
      [NOME, urlDe(lang)],
      [rotuloCategoria, urlDe(lang, `/categoria/${categoriaId}`)],
      [post.title, url],
    ]),
  ];
  return { '@context': 'https://schema.org', '@graph': grafo };
}

/** O `<script>` de JSON-LD, com `<` escapado para não fechar a tag. */
export const jsonLdComoHtml = (dados: unknown): string => JSON.stringify(dados).replace(/</g, '\\u003c');

// --- robots e llms ------------------------------------------------------------

/** Rastreadores de IA, nomeados um a um: vários só obedecem regra que os cite. */
const ROBOS_DE_IA = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'meta-externalagent', 'Bingbot',
  'CCBot', 'cohere-ai', 'YouBot', 'DuckAssistBot', 'MistralAI-User',
];

/** Páginas de conta e painel: não têm o que fazer na busca. */
const BLOQUEIOS = ['/api/', '/*/admin', '/*/perfil', '/*/favoritos', '/*/entrar', '/*/cadastro', '/*?q='];

export function robots(): string {
  // Prévias do Vercel (endereços de teste) nunca entram na busca.
  if (process.env.VERCEL_ENV === 'preview') return ['User-agent: *', 'Disallow: /', ''].join('\n');
  const regras = BLOQUEIOS.map((b) => `Disallow: ${b}`);
  return [
    `# ${NOME}`,
    '# Notícias e matérias de Pokémon GO. Conteúdo livre para leitura, busca e citação.',
    '',
    'User-agent: *',
    'Allow: /',
    ...regras,
    '',
    '# Rastreadores de IA: liberados, com crédito ao site.',
    ...ROBOS_DE_IA.flatMap((r) => [`User-agent: ${r}`, 'Allow: /', ...regras, '']),
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n');
}

export function llms(categorias: { id: string; pt: string; en: string }[]): string {
  return [
    `# ${NOME}`,
    '',
    `> ${textos.pt.descricao}`,
    '',
    'As notícias dos eventos vêm do LeekDuck e são atualizadas automaticamente, em português e inglês.',
    'As matérias são escritas pela equipe do PokeGoGuide.',
    '',
    '## Páginas',
    '',
    `- [Notícias](${urlDe('pt')}): tudo o que está no ar e o que vem no Pokémon GO.`,
    `- [Matérias](${urlDe('pt', '/materias')}): guias e análises escritas pela equipe.`,
    `- [Perguntas frequentes](${urlDe('pt', '/perguntas')}): dúvidas comuns sobre eventos e horários.`,
    `- [Feed RSS](${urlDe('pt', '/feed.xml')})`,
    '',
    '## Categorias',
    '',
    ...categorias.map((c) => `- [${c.pt}](${urlDe('pt', `/categoria/${c.id}`)})`),
    '',
    `Mais ferramentas (calculadora de IV, raids, ovos, rankings): ${SITE_PRINCIPAL}`,
    '',
  ].join('\n');
}
