/**
 * Regras de segurança do site, compartilhadas pelo proxy (CSP por requisição e proteção das páginas restritas).
 */

/** Mesmo nome que a API usa (em produção o prefixo __Host- só deixa o cookie valer com Secure, Path=/ e sem Domain). */
export const NOME_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-pgg_blog' : 'pgg_blog';

/** Páginas que exigem login (e, no painel, o papel de administrador). A API também confere: isto é a primeira trava. */
export const ROTAS_RESTRITAS = /^\/(pt|en)\/(admin|perfil|favoritos)(\/|$)/;
export const ROTA_ADMIN = /^\/(pt|en)\/admin(\/|$)/;

/**
 * Content-Security-Policy montada a cada requisição, com um `nonce` novo: só roda script que o servidor
 * marcou com ele. Mesmo que alguém consiga injetar um <script> na página (XSS), o navegador não o executa.
 *  - script-src com 'strict-dynamic': os scripts do próprio Next (com nonce) podem carregar outros (o Google Analytics).
 *  - style-src com 'unsafe-inline': animações (motion) e Tailwind usam atributos style; estilo não executa código.
 *  - img-src lista só quem de fato fornece imagem (LeekDuck e os sprites do GitHub).
 *  - connect-src lista só a PokeAPI (busca de Pokémon no perfil) e o Google Analytics.
 *  - frame-ancestors 'none': o site não pode ser embutido em iframe (anti-clickjacking).
 */
export function montarCsp(nonce: string, dev: boolean, local = false): string {
  const ga = ['https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'];
  const partes = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://cdn.leekduck.com https://raw.githubusercontent.com ${ga.join(' ')}`,
    "font-src 'self'",
    `connect-src 'self' https://pokeapi.co ${ga.join(' ')}${dev ? ' ws: http://localhost:*' : ''}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Em https força subrecurso http a virar https. Em localhost (teste local do build de produção) o site é http, então fica de fora.
    ...(dev || local ? [] : ['upgrade-insecure-requests']),
  ];
  return partes.join('; ');
}

/** Destino seguro depois do login: só caminho do próprio site (nada de //outro-site.com nem https://...). */
export function destinoSeguro(valor: string | null | undefined, lingua: string): string {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\') || /[\u0000-\u001f]/.test(valor)) return `/${lingua}`;
  return valor;
}
