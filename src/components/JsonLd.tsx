import { jsonLdComoHtml } from '../lib/seo.ts';

/** Dados estruturados da página (schema.org), para o Google entender o que é cada coisa. */
export function JsonLd({ dados }: { dados: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdComoHtml(dados) }} />;
}
