/**
 * O blog mora em `pokegoguide.com/blog`: o site principal repassa esse caminho
 * para cá (multi-zones do Next). Com o `basePath`, o Next já põe o prefixo nos
 * `<Link>`, no roteador, nos arquivos e no proxy; quem monta endereço à mão
 * (fetch, `window.location`, `<a>` comum) usa esta constante.
 */
export const BASE = '/blog';
