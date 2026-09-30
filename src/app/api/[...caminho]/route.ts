import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Repasse do navegador para a API (`/api/auth/login` → `API/auth/login`).
 *
 * Por que código e não um `rewrite`: aqui dá para (1) deixar passar SÓ as rotas que o navegador usa
 * (o /cron, por exemplo, nunca é alcançável pelo site), (2) repassar só os cabeçalhos necessários e (3) mandar à API
 * o IP real do visitante, ASSINADO com PROXY_SECRET. Sem isso a API enxergaria sempre o IP do servidor do site,
 * e "5 cadastros por hora por IP" viraria "5 por hora no site inteiro".
 */
export const dynamic = 'force-dynamic';

const API = new URL(process.env.API_URL ?? 'http://localhost:4000').origin;
const PERMITIDAS = /^(auth|posts|admin|categorias)(\/|$)/;
const SEGURO = /^(?!\.+$)[A-Za-z0-9_.~-]{1,160}$/;
const CABECALHOS_DO_NAVEGADOR = ['content-type', 'cookie', 'origin', 'accept', 'accept-language', 'user-agent'];
const CABECALHOS_DA_API = ['content-type', 'cache-control', 'retry-after', 'vary'];

const ipDoVisitante = (req: NextRequest): string | null => {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = xff || req.headers.get('x-real-ip')?.trim() || null;
  return ip && /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : null;
};

async function repassar(req: NextRequest, ctx: { params: Promise<{ caminho: string[] }> }): Promise<Response> {
  const { caminho } = await ctx.params;
  const relativo = caminho.join('/');
  // Só letras, números, _ . ~ - em cada trecho (e nunca só pontos). O Next já decodificou o %2f em "/" DENTRO de um trecho
  // ("..%2f..%2fcron" vira um trecho "../../cron"), e a URL final normalizaria o ".." e escaparia da lista de rotas.
  if (!caminho.every((p) => SEGURO.test(p)) || !PERMITIDAS.test(relativo)) {
    return Response.json({ erro: 'Não encontrado.' }, { status: 404 });
  }

  const cab = new Headers();
  for (const nome of CABECALHOS_DO_NAVEGADOR) {
    const v = req.headers.get(nome);
    if (v) cab.set(nome, v);
  }
  // O visitante não escolhe o próprio IP: qualquer x-client-* que ele mande é descartado (nem foi copiado acima).
  const segredo = process.env.PROXY_SECRET;
  const ip = ipDoVisitante(req);
  if (segredo && ip) {
    const ts = String(Date.now());
    cab.set('x-client-ip', ip);
    cab.set('x-client-ts', ts);
    cab.set('x-client-sig', createHmac('sha256', segredo).update(`${ip}|${ts}`).digest('hex'));
  }

  let resposta: Response;
  try {
    resposta = await fetch(new URL(`/${relativo}${req.nextUrl.search}`, API), {
      method: req.method,
      headers: cab,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      redirect: 'manual',
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return Response.json({ erro: 'Serviço indisponível. Tente de novo em instantes.' }, { status: 502 });
  }

  const saida = new Headers();
  for (const nome of CABECALHOS_DA_API) {
    const v = resposta.headers.get(nome);
    if (v) saida.set(nome, v);
  }
  // Mais de um cookie vem em cabeçalhos separados: cada um precisa ser repassado por inteiro.
  for (const c of resposta.headers.getSetCookie()) saida.append('set-cookie', c);
  return new Response(resposta.status === 204 ? null : resposta.body, { status: resposta.status, headers: saida });
}

export { repassar as GET, repassar as POST, repassar as PUT, repassar as PATCH, repassar as DELETE };
