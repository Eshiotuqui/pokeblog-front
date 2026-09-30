import type { NextConfig } from 'next';
import { BASE } from './src/lib/base.ts';

const config: NextConfig = {
  poweredByHeader: false,
  // O blog é servido em pokegoguide.com/blog (veja src/lib/base.ts).
  basePath: BASE,
  turbopack: { root: process.cwd() },
  // A API é alcançada pelo repasse em src/app/api/[...caminho]/route.ts (não por rewrite): ele filtra as rotas,
  // e repassa o IP real do visitante, assinado. O cookie de login fica no domínio do site.
  // Com o basePath, `/` aqui é `/blog`, e o destino vira `/blog/pt`.
  async redirects() {
    return [{ source: '/', destination: '/pt', permanent: false }];
  },
  // Cabeçalhos de segurança em todas as respostas. (A CSP, que muda a cada requisição por causa do nonce, é montada no proxy.)
  async headers() {
    const todas = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()' },
    ];
    return [
      { source: '/:path*', headers: todas },
      // Páginas de conta: nunca em cache (nem do navegador, nem de um proxy no meio).
      { source: '/:lang(pt|en)/:pagina(admin|perfil|favoritos|entrar|cadastro)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.leekduck.com' }] },
};
export default config;
