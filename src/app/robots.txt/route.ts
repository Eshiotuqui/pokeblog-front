import { robots } from '../../lib/seo.ts';

/**
 * `robots.txt` como rota, e não pelo `robots.ts` do Next: o formato dele não
 * escreve os comentários nem a lista de robôs de IA do jeito que vários deles leem.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(robots(), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
