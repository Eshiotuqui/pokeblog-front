import { chromium } from 'playwright-core';
import { createHmac } from 'node:crypto';
import { createHmac as hmac } from 'node:crypto';

/**
 * Roteiro de segurança no navegador de verdade (Playwright): páginas restritas, cadastro, MFA (QR, códigos de
 * recuperação, login em duas etapas), painel do admin exigindo MFA, redirecionamento aberto, cookie forjado e CSP.
 * Leia o README desta pasta para subir a API e o site de teste antes de rodar.
 */
const SITE = process.env.SITE ?? 'http://localhost:3500';
const API = process.env.API ?? 'http://localhost:4095';
const ADMIN = { email: process.env.ADMIN_EMAIL ?? 'chefe@teste.local', senha: process.env.ADMIN_PASSWORD ?? 'Tr0ca-esta-senha-forte-42' };
// JWT HS256 forjado à mão (para provar que o site NÃO aceita token assinado por quem não tem a chave RSA).
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function forjar(payload) { const cab = b64u({ alg: 'HS256', typ: 'JWT' }); const corpo = b64u({ ...payload, iss: 'pokeblog-api', aud: 'pokeblog', exp: Math.floor(Date.now() / 1000) + 3600 }); return cab + '.' + corpo + '.' + hmac('sha256', 'segredo-qualquer').update(cab + '.' + corpo).digest('base64url'); }

// TOTP independente da API (RFC 6238): é o que um app autenticador calcula.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function totp(seg, passos = 0) {
  let bits = 0, val = 0; const k = [];
  for (const c of seg.toUpperCase()) { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { k.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + passos));
  const h = createHmac('sha1', Buffer.from(k)).update(c).digest(); const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0');
}

let falhas = 0, total = 0;
const ok = (c, m) => { total++; console.log((c ? 'ok   ' : 'FALHA') + ' ' + m); if (!c) falhas++; };
const violacoes = []; const erros = [];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
async function novoContexto() {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.addInitScript(() => { document.addEventListener('securitypolicyviolation', (e) => { (window.__csp ??= []).push(e.violatedDirective + ' ' + e.blockedURI); }); });
  return ctx;
}
async function pagina(ctx) {
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/401|favicon|Failed to load resource/.test(m.text())) erros.push(m.text().slice(0, 160)); });
  p.on('pageerror', (e) => erros.push('pageerror: ' + e.message.slice(0, 160)));
  return p;
}
const coletarCsp = async (p) => { const v = await p.evaluate(() => window.__csp ?? []).catch(() => []); violacoes.push(...v); };
const senhaForte = 'Cachorro-Azul-7734';

// ── páginas restritas sem login ──
console.log('\n── Proteção das páginas restritas (verifica a assinatura RSA do cookie)');
{
  const ctx = await novoContexto(); const p = await pagina(ctx);
  for (const rota of ['/pt/perfil', '/pt/favoritos', '/pt/admin', '/en/perfil']) {
    await p.goto(SITE + rota); await p.waitForLoadState('networkidle');
    const lingua = rota.split('/')[1];
    ok(p.url().includes('/' + lingua + '/entrar') && p.url().includes('next=' + encodeURIComponent(rota)), rota + ' sem login → manda para o login, guardando o destino');
  }
  // cookie forjado (HS256 com qualquer segredo, e payload de admin): o proxy confere a assinatura e recusa
  const falso = forjar({ sub: 1, role: 'admin', tv: 0, mfa: true, typ: 'sessao' });
  await ctx.addCookies([{ name: 'pgg_blog', value: falso, url: SITE }]);
  await p.goto(SITE + '/pt/admin'); await p.waitForLoadState('networkidle');
  ok(p.url().includes('/pt/entrar'), 'cookie de login FORJADO (assinatura inválida) não abre o painel');
  await p.goto(SITE + '/pt'); await coletarCsp(p); await ctx.close();
}

// ── cadastro + MFA pela interface ──
console.log('\n── Cadastro, MFA e login em duas etapas (pela interface)');
const u1 = { email: 'ana.e2e@exemplo.com', nome: 'Ana E2E' };
let segredo = '';
{
  const ctx = await novoContexto(); const p = await pagina(ctx);
  await p.goto(SITE + '/pt/cadastro');
  await p.fill('input[name=name]', u1.nome); await p.fill('input[name=email]', u1.email); await p.fill('input[name=password]', 'password123');
  await p.click('button:has-text("Criar conta")'); await p.waitForTimeout(1200);
  ok(/Essa senha é muito comum/.test(await p.textContent('body')), 'senha comum: a interface mostra o motivo da recusa');
  await p.fill('input[name=password]', senhaForte); await p.click('button:has-text("Criar conta")');
  await p.waitForURL(SITE + '/pt', { timeout: 15000 });
  ok(true, 'cadastro com senha forte entra e vai para a página inicial');

  await p.goto(SITE + '/pt/perfil'); await p.waitForLoadState('networkidle');
  ok(await p.locator('h2:has-text("Segurança da conta")').isVisible(), 'o perfil mostra a seção de Segurança da conta');
  await p.click('button:has-text("Ativar MFA")');
  await p.waitForSelector('img[alt="QR code"]', { timeout: 10000 });
  segredo = (await p.textContent('code.select-all')).trim();
  ok(/^[A-Z2-7]{32}$/.test(segredo), 'aparece o QR code e a chave manual de 160 bits');
  ok((await p.locator('img[alt="QR code"]').getAttribute('src')).startsWith('data:image/png'), 'o QR code é desenhado no navegador (imagem data:), sem serviço externo');
  await p.fill('input[name=codigo]', '000000'); await p.click('button:has-text("Confirmar e ativar")'); await p.waitForTimeout(1000);
  ok(/inválido/i.test(await p.textContent('body')), 'código errado na ativação: mensagem de erro');
  await p.fill('input[name=codigo]', totp(segredo)); await p.click('button:has-text("Confirmar e ativar")');
  await p.waitForSelector('text=Guarde estes códigos de recuperação', { timeout: 10000 });
  const rec = await p.locator('ul.font-mono li').allTextContents();
  ok(rec.length === 8 && rec.every((c) => /^[a-z2-7]{5}-[a-z2-7]{5}$/.test(c)), 'MFA ativado: 8 códigos de recuperação mostrados uma vez');
  await p.click('button:has-text("Já guardei")');
  ok(await p.locator('text=Ativa').first().isVisible(), 'o painel passa a mostrar o MFA como ativo');
  await coletarCsp(p);

  // sai e entra de novo: agora são duas etapas
  await p.click('button[aria-label="Sair"]'); await p.waitForTimeout(800);
  await p.goto(SITE + '/pt/perfil'); await p.waitForLoadState('networkidle');
  ok(p.url().includes('/pt/entrar'), 'depois de sair, o perfil volta a pedir login');
  await p.fill('input[name=email]', u1.email); await p.fill('input[name=password]', senhaForte); await p.click('button:has-text("Entrar")');
  await p.waitForSelector('text=Verificação em duas etapas', { timeout: 10000 });
  ok(true, 'com MFA ativo, a senha certa leva à segunda etapa (código), não direto ao site');
  await p.goto(SITE + '/pt/perfil'); await p.waitForLoadState('networkidle');
  ok(p.url().includes('/pt/entrar'), 'na segunda etapa ainda NÃO se está logado (perfil continua barrado)');
  await p.fill('input[name=email]', u1.email); await p.fill('input[name=password]', senhaForte); await p.click('button:has-text("Entrar")');
  await p.waitForSelector('input[name=codigo]');
  await p.fill('input[name=codigo]', '123456'); await p.click('button:has-text("Verificar e entrar")'); await p.waitForTimeout(1000);
  ok(/inválido/i.test(await p.textContent('body')), 'código errado no login: recusado com mensagem');
  await p.fill('input[name=codigo]', totp(segredo, 1)); await p.click('button:has-text("Verificar e entrar")');
  await p.waitForURL(SITE + '/pt/perfil', { timeout: 15000 });
  ok(true, 'código certo (do passo seguinte, pois o atual já foi usado na ativação): entra e volta para a página que a pessoa queria (?next)');
  await p.goto(SITE + '/pt/perfil'); await p.waitForLoadState('networkidle');
  ok(p.url().endsWith('/pt/perfil'), 'logado com MFA, o perfil abre');

  // sair de todos os aparelhos
  await p.click('button:has-text("Sair de todos os aparelhos")'); await p.waitForURL('**/entrar', { timeout: 15000 });
  ok(true, '"Sair de todos os aparelhos" desloga e leva ao login');
  await coletarCsp(p); await ctx.close();
}

// ── redirecionamento aberto ──
console.log('\n── Redirecionamento aberto (?next=)');
{
  await fetch(API + '/auth/register', { method: 'POST', headers: { 'content-type': 'application/json', origin: SITE }, body: JSON.stringify({ email: 'bia.e2e@exemplo.com', password: senhaForte, name: 'Bia' }) });
  const ctx = await novoContexto(); const p = await pagina(ctx);
  for (const alvo of ['//site-malicioso.com', 'https://site-malicioso.com', '/\\site-malicioso.com']) {
    await p.goto(SITE + '/pt/entrar?next=' + encodeURIComponent(alvo));
    await p.fill('input[name=email]', 'bia.e2e@exemplo.com'); await p.fill('input[name=password]', senhaForte); await p.click('button:has-text("Entrar")');
    await p.waitForTimeout(2500);
    ok(new URL(p.url()).origin === SITE, 'next=' + alvo + ' → fica no próprio site (' + new URL(p.url()).pathname + ')');
    await p.request.post(SITE + '/api/auth/logout', { headers: { origin: SITE } });
    await ctx.clearCookies();
  }
  await p.goto(SITE + '/pt/entrar?next=' + encodeURIComponent('/pt/favoritos'));
  await p.fill('input[name=email]', 'bia.e2e@exemplo.com'); await p.fill('input[name=password]', senhaForte); await p.click('button:has-text("Entrar")');
  await p.waitForURL('**/pt/favoritos', { timeout: 10000 });
  ok(true, 'next=/pt/favoritos (caminho do próprio site) funciona: volta para onde a pessoa queria ir');
  // usuário comum no painel
  await p.goto(SITE + '/pt/admin'); await p.waitForLoadState('networkidle');
  ok(new URL(p.url()).pathname === '/pt', 'usuário comum em /pt/admin: mandado para a página inicial (nem vê o painel)');
  await coletarCsp(p); await ctx.close();
}

// ── admin exige MFA ──
console.log('\n── Administrador: o painel exige MFA');
{
  const ctx = await novoContexto(); const p = await pagina(ctx);
  await p.goto(SITE + '/pt/entrar'); await p.fill('input[name=email]', ADMIN.email); await p.fill('input[name=password]', ADMIN.senha); await p.click('button:has-text("Entrar")');
  await p.waitForURL(SITE + '/pt', { timeout: 15000 });
  ok(await p.locator('text=Para usar o painel de administrador, ative a verificação em duas etapas').first().isVisible(), 'faixa de aviso: o admin precisa ativar o MFA');
  await p.goto(SITE + '/pt/admin'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  ok(await p.locator('text=Configurar agora').first().isVisible() && !(await p.locator('text=Nova matéria').isVisible()), 'sem MFA, o painel NÃO abre: mostra o motivo e o caminho para configurar');
  await p.goto(SITE + '/pt/perfil'); await p.waitForLoadState('networkidle');
  ok(!(await p.locator('button:has-text("Desativar MFA")').count()), 'e o admin não tem botão para desativar o MFA depois');
  await p.click('button:has-text("Ativar MFA")'); await p.waitForSelector('code.select-all');
  const seg = (await p.textContent('code.select-all')).trim();
  await p.fill('input[name=codigo]', totp(seg)); await p.click('button:has-text("Confirmar e ativar")');
  await p.waitForSelector('text=Guarde estes códigos de recuperação'); await p.click('button:has-text("Já guardei")');
  await p.goto(SITE + '/pt/admin'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  ok(await p.locator('text=Nova matéria').first().isVisible(), 'com o MFA ativo, o painel do administrador abre');
  ok(!(await p.locator('text=Para usar o painel de administrador').count()), 'e a faixa de aviso some');
  await coletarCsp(p); await ctx.close();
}

// ── varredura de páginas públicas ──
console.log('\n── Páginas públicas: nenhuma violação de CSP nem erro de script');
{
  const ctx = await novoContexto(); const p = await pagina(ctx);
  for (const r of ['/pt', '/en', '/pt/materias', '/pt/perguntas', '/pt/categoria/raids', '/pt/entrar', '/pt/cadastro']) {
    await p.goto(SITE + r); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400); await coletarCsp(p);
  }
  await ctx.close();
}
ok(violacoes.length === 0, 'CSP: nenhuma violação em todo o roteiro' + (violacoes.length ? ' → ' + [...new Set(violacoes)].slice(0, 5).join(' | ') : ''));
ok(erros.length === 0, 'nenhum erro de JavaScript no console' + (erros.length ? ' → ' + [...new Set(erros)].slice(0, 4).join(' | ') : ''));

await browser.close();
console.log('\n' + (falhas ? falhas + ' FALHA(S) em ' + total : 'tudo certo: ' + total + ' verificações no navegador passaram'));
process.exit(falhas ? 1 : 0);
