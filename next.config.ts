import type { NextConfig } from 'next';

// Só a origem (https://host): barra ou caminho sobrando no final (".../0") quebravam todas as rotas.
const API = new URL(process.env.API_URL ?? 'http://localhost:4000').origin;

const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // O navegador fala só com o próprio site; o Next repassa para a API.
  // Assim o cookie de login é do mesmo domínio (sem CORS nem cookie de terceiros).
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API}/:path*` }];
  },
  async redirects() {
    return [{ source: '/', destination: '/pt', permanent: false }];
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.leekduck.com' }] },
};
export default config;
