import type { NextConfig } from 'next';

const API = process.env.API_URL ?? 'http://localhost:4000';

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
