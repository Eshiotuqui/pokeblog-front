import { servidorOpcional, type Categoria } from '../../lib/api.ts';
import { llms } from '../../lib/seo.ts';

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const cats = (await servidorOpcional<{ categorias: Categoria[] }>('/categorias'))?.categorias ?? [];
  return new Response(llms(cats), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
