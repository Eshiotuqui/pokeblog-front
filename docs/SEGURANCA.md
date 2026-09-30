# Segurança do site

| Item | Como está | Onde |
|---|---|---|
| **CSP** | Política montada **a cada requisição com um nonce novo**: só roda script que o servidor marcou. `script-src 'self' 'nonce-…' 'strict-dynamic'` (sem `unsafe-inline` nem `unsafe-eval` em produção), imagens só do LeekDuck e do GitHub, conexões só para a própria origem, a PokeAPI e o Google Analytics, `frame-ancestors 'none'`. Testado no navegador: XSS por marcação (`onerror`, `javascript:`, `<script>` do parser), exfiltração para outro servidor e iframe de outro site são **bloqueados**. | `src/lib/seguranca.ts`, `src/proxy.ts` |
| **Páginas restritas** | `/admin`, `/perfil` e `/favoritos` conferem a **assinatura RSA** do cookie com a chave pública (`JWT_PUBLIC_KEY`) antes de entregar a página; `/admin` exige papel de admin. Cookie forjado (qualquer outra chave) é recusado. É a primeira trava: revogação, papel atual e MFA quem confere é a API a cada chamada. | `src/proxy.ts` |
| **Repasse para a API** | `/api/*` não é um redirecionamento: é código que (1) só deixa passar `auth`, `posts`, `admin` e `categorias` (o `/cron`, por exemplo, nunca é alcançável pelo site), (2) aceita só caracteres seguros em cada trecho do caminho (barra tentativas de `..%2f`), (3) repassa só os cabeçalhos necessários e (4) manda o **IP real do visitante assinado** (`PROXY_SECRET`) para os limites da API valerem por pessoa. | `src/app/api/[...caminho]/route.ts` |
| **Cabeçalhos** | HSTS (2 anos, preload), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (sem câmera, microfone, localização…), `COOP`. Páginas de conta com `Cache-Control: no-store`. | `next.config.ts` |
| **Login e MFA (telas)** | Login em duas etapas; ativação do MFA com QR code **desenhado no navegador** (o segredo nunca vai a um serviço de imagens); códigos de recuperação mostrados uma vez; troca de senha; "sair de todos os aparelhos"; faixa de aviso para o admin sem MFA. | `components/SegurancaForm.tsx`, `AuthForm.tsx`, `AvisoMfa.tsx` |
| **Redirecionamento aberto** | O `?next=` do login só vale se for um caminho do próprio site (`//outro.com`, `https://…` e `/\outro.com` são descartados). | `lib/seguranca.ts` |
| **Saída segura** | O React escapa tudo; o corpo das matérias é renderizado sem `innerHTML`; o JSON-LD escapa `<`. | `components/Corpo.tsx`, `lib/seguranca.ts` |

## Variáveis do site

| Variável | Para quê |
|---|---|
| `API_URL` | Endereço da API (só a origem) |
| `PROXY_SECRET` | **Igual ao da API**. Assina o IP do visitante |
| `JWT_PUBLIC_KEY` | A chave **pública** do login (pode ficar no site: não permite forjar nada). Sem ela a primeira trava fica desligada e o site confia só na API |
| `NEXT_PUBLIC_SITE_URL` | Endereço do site. Precisa ser **igual ao `WEB_ORIGIN` da API** |

## Testes

`npx tsc --noEmit` para os tipos. Os roteiros no navegador estão em `e2e/` (veja o README de lá): 32 verificações do fluxo de
segurança e 9 da CSP de produção.

## Limites conhecidos

- `style-src` usa `'unsafe-inline'` (as animações e o Tailwind usam atributos `style`). Estilo não executa código, mas é uma concessão.
- Com `strict-dynamic`, um script **já executando** com nonce pode carregar outros; a proteção é contra *injeção de marcação*, que é como o XSS acontece.
- `SameSite=Strict` faz quem chega ao site por um link de outro endereço ver `/perfil` pedir login na primeira visita (a navegação seguinte já leva o cookie).
