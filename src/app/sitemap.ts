import type { MetadataRoute } from 'next';
import { servidorOpcional, type Categoria, type ItemSitemap } from '../lib/api.ts';
import { LINGUAS, type Lingua } from '../lib/i18n.ts';
import { SITE, urlDe } from '../lib/seo.ts';

// Atualiza de hora em hora: notícia nova entra no sitemap sem novo deploy.
export const revalidate = 3600;

const alternativas = (langs: Lingua[], caminho: string) => ({
  languages: Object.fromEntries(langs.map((l) => [l === 'pt' ? 'pt-BR' : 'en', urlDe(l, caminho)])),
});

/** `/sitemap.xml`: as páginas fixas, as categorias e cada notícia/matéria, com hreflang. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();
  const [posts, cats] = await Promise.all([
    servidorOpcional<{ posts: ItemSitemap[] }>('/posts/sitemap'),
    servidorOpcional<{ categorias: Categoria[] }>('/categorias'),
  ]);
  const fixas: [string, MetadataRoute.Sitemap[number]['changeFrequency'], number][] = [
    ['', 'hourly', 1], ['/materias', 'daily', 0.9], ['/perguntas', 'monthly', 0.5],
    ...(cats?.categorias ?? []).map((c): [string, MetadataRoute.Sitemap[number]['changeFrequency'], number] => [`/categoria/${c.id}`, 'daily', 0.7]),
  ];
  return [
    ...fixas.flatMap(([caminho, changeFrequency, priority]) =>
      LINGUAS.map((l) => ({ url: urlDe(l, caminho), lastModified: agora, changeFrequency, priority, alternates: alternativas([...LINGUAS], caminho) }))),
    // Só entra o idioma em que o texto existe de verdade: página em português com texto em inglês não é listada.
    ...(posts?.posts ?? []).flatMap((p) =>
      p.langs.map((l) => ({
        url: urlDe(l, `/noticias/${p.slug}`), lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const,
        priority: p.source === 'admin' ? 0.8 : 0.6, alternates: alternativas(p.langs, `/noticias/${p.slug}`),
      }))),
  ].filter((e) => e.url.startsWith(SITE));
}
