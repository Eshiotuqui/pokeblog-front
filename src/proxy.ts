import { importSPKI, jwtVerify, type CryptoKey, type KeyObject } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { montarCsp, NOME_COOKIE, ROTA_ADMIN, ROTAS_RESTRITAS } from './lib/seguranca.ts';

/**
 * Proxy (antigo "middleware") do Next: roda antes de cada página.
 *  1. CSP com nonce novo por requisição (veja lib/seguranca.ts).
 *  2. Páginas restritas (/admin, /perfil, /favoritos): confere a ASSINATURA RSA do cookie de login com a
 *     chave PÚBLICA (JWT_PUBLIC_KEY). Quem só tem a pública consegue conferir, mas não forjar sessão.
 *     Sem cookie válido (ou, no painel, sem ser admin), volta para o login sem nem entregar a página.
 *     É a primeira trava; quem decide de verdade (revogação, papel atual, MFA) é a API a cada chamada.
 */
let chave: Promise<CryptoKey | KeyObject> | null = null;
function chavePublica(): Promise<CryptoKey | KeyObject> | null {
  const b64 = process.env.JWT_PUBLIC_KEY;
  if (!b64) return null; // sem a chave, o site confia só na API (o painel continua protegido lá)
  chave ??= importSPKI(b64.includes('BEGIN') ? b64 : Buffer.from(b64, 'base64').toString('utf8'), 'RS256');
  return chave;
}

async function sessaoValida(token: string | undefined): Promise<{ role: string } | null> {
  const k = chavePublica();
  if (!token || !k) return null;
  try {
    const { payload } = await jwtVerify(token, await k, { algorithms: ['RS256'], issuer: 'pokeblog-api', audience: 'pokeblog' });
    return payload.typ === 'sessao' ? { role: String(payload.role) } : null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ROTAS_RESTRITAS.test(pathname) && chavePublica()) {
    const s = await sessaoValida(req.cookies.get(NOME_COOKIE)?.value);
    const lingua = pathname.split('/')[1] ?? 'pt';
    if (!s) {
      const url = req.nextUrl.clone();
      url.pathname = `/${lingua}/entrar`;
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    if (ROTA_ADMIN.test(pathname) && s.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = `/${lingua}`;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = montarCsp(nonce, process.env.NODE_ENV !== 'production', ['localhost', '127.0.0.1'].includes(req.nextUrl.hostname));
  const cabecalhos = new Headers(req.headers);
  cabecalhos.set('x-nonce', nonce);
  cabecalhos.set('content-security-policy', csp); // o Next lê o nonce daqui e o coloca nos próprios scripts
  const res = NextResponse.next({ request: { headers: cabecalhos } });
  res.headers.set('content-security-policy', csp);
  return res;
}

export const config = {
  matcher: [
    {
      // Páginas: fora daqui ficam a API (/api), os arquivos do Next e os arquivos públicos.
      source: '/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|og-image.png|icon-\\d+\\.png|robots.txt|sitemap.xml|llms.txt|.*\\.xml$).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }, { type: 'header', key: 'purpose', value: 'prefetch' }],
    },
  ],
};
