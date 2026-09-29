import { notFound } from 'next/navigation';
import { servidorOpcional, type Lista } from '../../../lib/api.ts';
import { ehLingua, textos } from '../../../lib/i18n.ts';
import { NOME, SITE, urlDe } from '../../../lib/seo.ts';

export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Feed RSS 2.0 (`/pt/feed.xml`): leitores de feed e agregadores; ajuda a descoberta de posts novos. */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }): Promise<Response> {
  const { lang } = await params;
  if (!ehLingua(lang)) notFound();
  const lista = await servidorOpcional<Lista>(`/posts?lang=${lang}&limit=30`);
  const itens = (lista?.posts ?? []).map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${urlDe(lang, `/noticias/${p.slug}`)}</link>
      <guid isPermaLink="true">${urlDe(lang, `/noticias/${p.slug}`)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.summary)}</description>${p.image && /^https?:\/\//.test(p.image) ? `\n      <enclosure url="${esc(p.image)}" type="image/jpeg" length="0"/>` : ''}
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(NOME)}</title>
    <link>${urlDe(lang)}</link>
    <description>${esc(textos[lang].descricao)}</description>
    <language>${lang === 'pt' ? 'pt-BR' : 'en'}</language>
    <atom:link href="${urlDe(lang, '/feed.xml')}" rel="self" type="application/rss+xml"/>
    <generator>${SITE}</generator>
${itens}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
