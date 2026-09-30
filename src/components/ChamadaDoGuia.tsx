import { ArrowRight } from 'lucide-react';
import type { Lingua } from '../lib/i18n.ts';
import { SITE_PRINCIPAL } from '../lib/seo.ts';
import { Pokebola } from './Marca.tsx';

/**
 * Chamada para o PokeGoGuide no fim de cada notícia.
 *
 * Quem leu sobre uma raid quer saber quem levar; quem leu sobre o Dia
 * Comunitário vai querer ver o IV do que pegou. Por isso a chamada muda com
 * o assunto e leva direto à tela que resolve isso, e não só à página inicial.
 *
 * `<a>` comum: o site principal é outro app (o `<Link>` ficaria preso no `/blog`).
 */
type Chamada = { caminho: string; pt: [string, string, string]; en: [string, string, string] };

const GERAL: Chamada = {
  caminho: '/',
  pt: ['Tudo do Pokémon GO num lugar só', 'Raids e eventos de hoje, counters, calculadora de IV, tipos, ovos e Team GO Rocket. Grátis e sem conta.', 'Abrir o PokeGoGuide'],
  en: ['All of Pokémon GO in one place', "Today's raids and events, counters, IV calculator, types, eggs and Team GO Rocket. Free, no account needed.", 'Open PokeGoGuide'],
};

const POR_CATEGORIA: Record<string, Chamada> = {
  raids: {
    caminho: '/raids',
    pt: ['Quem levar para essa raid?', 'O PokeGoGuide mostra os 3 melhores counters de cada chefe no ar, o CP de captura e o CP com clima.', 'Ver os counters'],
    en: ['Who should you bring to this raid?', 'PokeGoGuide shows the top 3 counters for every current boss, plus catch CP and weather-boosted CP.', 'See the counters'],
  },
  max: {
    caminho: '/raids',
    pt: ['Monte seu time para a Batalha Max', 'Os melhores Pokémon Dinamax contra cada chefe no ar, com tempo até sair e CP com clima.', 'Ver as Batalhas Max'],
    en: ['Build your Max Battle team', 'The best Dynamax Pokémon against every current boss, with time left and weather-boosted CP.', 'See Max Battles'],
  },
  'community-day': {
    caminho: '/iv',
    pt: ['Pegou um bom? Veja o IV', 'Mande o print da avaliação e a calculadora do PokeGoGuide lê as barras e mostra o IV na hora.', 'Calcular o IV'],
    en: ['Caught a good one? Check the IV', 'Upload a screenshot of the appraisal and PokeGoGuide reads the bars and shows the IV right away.', 'Calculate IV'],
  },
  'battle-league': {
    caminho: '/golpes',
    pt: ['Qual golpe usar na liga?', 'O PokeGoGuide mostra a melhor combinação de golpes de cada Pokémon, com dano e DPS.', 'Ver os golpes'],
    en: ['Which moves for the league?', 'PokeGoGuide shows the best moveset for every Pokémon, with damage and DPS.', 'See the moves'],
  },
  season: {
    caminho: '/ovos',
    pt: ['O que sai de cada ovo nesta temporada', 'A lista completa dos ovos de 1 a 12 km, com as chances de shiny, sempre atualizada.', 'Ver os ovos'],
    en: ['What hatches from each egg this season', 'The full list of 1 to 12 km eggs, with shiny chances, always up to date.', 'See the eggs'],
  },
};
POR_CATEGORIA.spotlight = POR_CATEGORIA['community-day']!;
POR_CATEGORIA.research = POR_CATEGORIA['community-day']!;

export function ChamadaDoGuia({ categoria, lingua }: { categoria: string; lingua: Lingua }) {
  const c = POR_CATEGORIA[categoria] ?? GERAL;
  const [titulo, texto, botao] = c[lingua];
  return (
    <aside className="card flex flex-col gap-4 border-tema/40 bg-gradient-to-br from-tema/15 via-surface to-surface p-5 sm:flex-row sm:items-center">
      <span className="shrink-0"><Pokebola tamanho={44} /></span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-lg font-extrabold leading-tight">{titulo}</p>
        <p className="text-sm text-muted">{texto}</p>
      </div>
      <a href={`${SITE_PRINCIPAL}${c.caminho}`} className="botao inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap">
        {botao}<ArrowRight size={16} />
      </a>
    </aside>
  );
}
