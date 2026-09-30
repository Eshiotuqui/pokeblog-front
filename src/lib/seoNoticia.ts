import type { Post } from './api.ts';
import { localeDe, type Lingua } from './i18n.ts';

/**
 * Título e descrição de busca das notícias automáticas.
 *
 * O título que vem do LeekDuck é o nome do evento ("Pesquisa por tempo
 * limitado adidas × Pokémon"): não diz "Pokémon GO" nem o que a página
 * responde. A descrição era a frase genérica "…está chegando ao Pokémon GO.
 * Categoria: Pesquisa.". Quem busca escreve "evento adidas pokemon go" ou
 * "recompensas adidas pokemon go", e são essas palavras que o Google procura
 * no título e mostra em negrito na descrição.
 *
 * Tudo sai dos dados do próprio post (datas, bônus, recompensas, Pokémon),
 * na hora de montar a página: vale para as notícias que já existem, sem
 * mexer no banco. O `h1` continua o nome do evento. As matérias (escritas no
 * admin) ficam com o título e o resumo de quem escreveu.
 */

const TEXTOS = {
  pt: {
    noJogo: ' no Pokémon GO',
    sufixo: {
      research: 'tarefas e recompensas',
      'community-day': 'bônus e horário',
      spotlight: 'bônus e horário',
      raids: 'datas e horário',
      raidsShiny: 'datas, horário e shiny',
      max: 'datas e horário',
      'battle-league': 'regras e datas',
      season: 'bônus e datas',
      event: 'datas e horários',
      eventBonus: 'bônus e datas',
      eventPesquisa: 'bônus, pesquisas e datas',
    },
    em: 'Em', de: 'De', a: 'a', das: 'das', as: 'às', evento: 'Evento de', eventoEm: 'Evento em',
    pokemon: 'Pokémon', bonus: 'Bônus', recompensas: 'Recompensas', regras: 'Regras',
    fecho: 'Veja tudo no PokeGoGuide.',
  },
  en: {
    noJogo: ' in Pokémon GO',
    sufixo: {
      research: 'tasks and rewards',
      'community-day': 'bonuses and times',
      spotlight: 'bonus and time',
      raids: 'dates and times',
      raidsShiny: 'dates, times and shiny',
      max: 'dates and times',
      'battle-league': 'rules and dates',
      season: 'bonuses and dates',
      event: 'dates and times',
      eventBonus: 'bonuses and dates',
      eventPesquisa: 'bonuses, research and dates',
    },
    em: 'On', de: 'From', a: 'to', das: 'from', as: 'to', evento: 'Event from', eventoEm: 'Event on',
    pokemon: 'Pokémon', bonus: 'Bonuses', recompensas: 'Rewards', regras: 'Rules',
    fecho: 'Full details on PokeGoGuide.',
  },
} as const;

/** Até onde o Google mostra a descrição sem cortar. */
const MAX_DESCRICAO = 155;

// --- Leitura do corpo ----------------------------------------------------------
// O corpo usa marcas por linha: "## seção", "- item", "@ Pokémon | img",
// "% n | etapa", "> tarefa | recompensa | img" e "+ prêmio | img".

interface Secao { titulo: string; linhas: string[] }

function secoes(corpo: string): Secao[] {
  const lista: Secao[] = [{ titulo: '', linhas: [] }];
  for (const bruta of corpo.split('\n')) {
    const l = bruta.trim();
    if (!l) continue;
    if (l.startsWith('## ')) lista.push({ titulo: l.slice(3).trim(), linhas: [] });
    else lista.at(-1)!.linhas.push(l);
  }
  return lista;
}

const primeiroCampo = (l: string): string => l.slice(2).split('|')[0]!.trim().replace(/[*.]+$/, '').trim();

/** Item que não diz nada do evento ("Fonte: anúncio oficial"), ou longo demais para caber numa lista. */
const itemUtil = (x: string): boolean => x.length <= 60 && !/^(fonte|source|nota?|obs)\b/i.test(x);
const unicos = (xs: string[]): string[] => [...new Set(xs.filter(Boolean))];

const EH_BONUS = /b[ôo]nus|bonuses/i;
const EH_SHINY = /shiny|brilhante/i;

function lerCorpo(corpo: string) {
  const todas = secoes(corpo);
  const linhas = todas.flatMap((s) => s.linhas);
  // Prêmio "de verdade": fora ficam os só-número ("×50", "1.000 XP"), que não dizem o que é.
  const premios = unicos(linhas.filter((l) => l.startsWith('+ ')).map(primeiroCampo))
    .filter((p) => /\p{L}{3,}/u.test(p.replace(/\bXP\b/g, '')));
  return {
    pokemon: unicos(todas.filter((s) => !EH_SHINY.test(s.titulo)).flatMap((s) => s.linhas.filter((l) => l.startsWith('@ ')).map(primeiroCampo))),
    bonus: unicos(todas.filter((s) => EH_BONUS.test(s.titulo)).flatMap((s) => s.linhas.filter((l) => l.startsWith('- ')).map(primeiroCampo))).filter(itemUtil),
    regras: unicos(linhas.filter((l) => l.startsWith('- ')).map(primeiroCampo)).filter(itemUtil),
    premios,
    temShiny: todas.some((s) => EH_SHINY.test(s.titulo)),
    temPesquisa: linhas.some((l) => l.startsWith('% ')),
  };
}

// --- Título --------------------------------------------------------------------

/** O nome do evento, sem a temporada que a Liga de Batalha pendura no fim ("… | Trilhas do Crepúsculo"). */
const nomeDoEvento = (t: string): string => t.split(' | ')[0]!.trim();

/** Categorias em que a busca costuma levar o ano ("dia comunitário novembro 2026"). */
const COM_ANO = new Set(['community-day', 'event', 'research', 'season']);

export function tituloDeBusca(post: Post): string {
  const x = TEXTOS[post.lingua];
  const corpo = lerCorpo(post.body ?? '');
  let nome = nomeDoEvento(post.title);
  const ano = post.eventStart?.slice(0, 4);
  if (ano && COM_ANO.has(post.category) && !/\b20\d\d\b/.test(nome)) nome = `${nome} ${ano}`;
  const noJogo = /pok[ée]mon go/i.test(nome) ? '' : x.noJogo;
  const s = x.sufixo;
  const sufixo = post.category === 'raids' ? (corpo.temShiny ? s.raidsShiny : s.raids)
    : post.category === 'event' ? (corpo.temPesquisa ? s.eventPesquisa : corpo.bonus.length ? s.eventBonus : s.event)
    : s[post.category as keyof typeof s] ?? s.event;
  return `${nome}${noJogo}: ${sufixo}`;
}

// --- Descrição -----------------------------------------------------------------

/** "2026-09-25T10:00:00.000" → data no fuso de quem joga (a data vem sem fuso e vale no horário local). */
const comoData = (s: string): Date => new Date(`${s.slice(0, 19)}Z`);
const dia = (s: string, l: Lingua, comAno = true): string =>
  new Intl.DateTimeFormat(localeDe(l), { day: 'numeric', month: 'short', ...(comAno ? { year: 'numeric' as const } : {}), timeZone: 'UTC' }).format(comoData(s));

/** Evento, pesquisa e temporada: a descrição diz "Evento", que é a palavra de quem busca ("evento adidas pokemon go"). */
const EH_EVENTO = new Set(['event', 'research', 'season', 'community-day']);
const hora = (s: string, l: Lingua): string =>
  new Intl.DateTimeFormat(localeDe(l), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(comoData(s));

function quando(post: Post): string | null {
  const x = TEXTOS[post.lingua];
  const { eventStart: ini, eventEnd: fim, lingua: l } = post;
  if (!ini || Number.isNaN(comoData(ini).getTime())) return null;
  const evento = EH_EVENTO.has(post.category);
  const em = evento ? x.eventoEm : x.em;
  if (!fim || Number.isNaN(comoData(fim).getTime())) return `${em} ${dia(ini, l)}.`;
  if (ini.slice(0, 10) === fim.slice(0, 10)) return `${em} ${dia(ini, l)}, ${x.das} ${hora(ini, l)} ${x.as} ${hora(fim, l)}.`;
  // No mesmo ano, o ano só no fim: "de 13 de out. a 19 de out. de 2026".
  const mesmoAno = ini.slice(0, 4) === fim.slice(0, 4);
  return `${evento ? x.evento : x.de} ${dia(ini, l, !mesmoAno)} ${x.a} ${dia(fim, l)}.`;
}

/** As regras já trazem vírgula por dentro ("1.500 CP ou menos, sem Mega"): entre elas vai ponto e vírgula. */
const lista = (rotulo: string, itens: string[], n: number, sep = ', '): string | null =>
  (itens.length ? `${rotulo}: ${itens.slice(0, n).join(sep)}.` : null);

export function descricaoDeBusca(post: Post): string {
  const x = TEXTOS[post.lingua];
  const c = lerCorpo(post.body ?? '');
  const partes = [
    quando(post),
    post.category === 'battle-league' ? lista(x.regras, c.regras, 2, '; ') : null,
    lista(x.bonus, c.bonus, 3),
    lista(x.recompensas, c.premios, 3),
    lista(x.pokemon, c.pokemon, 3),
    x.fecho,
  ].filter((p): p is string => Boolean(p));

  // Entra parte por parte enquanto couber; a primeira (as datas) sempre entra.
  let texto = '';
  for (const p of partes) {
    const junto = texto ? `${texto} ${p}` : p;
    if (texto && junto.length > MAX_DESCRICAO) continue;
    texto = junto;
  }
  // Sem nada do corpo (evento só anunciado), fica o resumo, sem o "Categoria: …" do fim.
  const resumo = post.summary.replace(/\s*(Categoria|Category):[^.]*\.?/g, '').trim();
  if (partes.length <= 2 && resumo) texto = `${resumo} ${texto}`.trim();
  return texto.length <= MAX_DESCRICAO ? texto : `${texto.slice(0, MAX_DESCRICAO - 1).trimEnd()}…`;
}
