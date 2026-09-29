import type { Lingua } from './i18n.ts';
import type { Pergunta } from './seo.ts';

/** As dúvidas mais comuns sobre o blog e os eventos. Precisam estar visíveis na página: é regra do Google para marcar FAQ. */
export const PERGUNTAS: Record<Lingua, Pergunta[]> = {
  pt: [
    { pergunta: 'O que é o PokeGoGuide Blog?', resposta: 'É o blog do PokeGoGuide com as notícias e os eventos do Pokémon GO: o que está no ar agora, o que começa em breve e o que está para acabar, sempre em português e em inglês.' },
    { pergunta: 'Com que frequência as notícias são atualizadas?', resposta: 'Os eventos são buscados automaticamente várias vezes por dia. Assim que um evento novo aparece na fonte, ele vira uma notícia aqui, com datas, bônus e recompensas.' },
    { pergunta: 'De onde vêm as informações dos eventos?', resposta: 'Os dados dos eventos vêm do LeekDuck, e cada notícia traz o link da fonte original. As matérias são escritas pela equipe do PokeGoGuide.' },
    { pergunta: 'Qual é o horário dos eventos do Pokémon GO?', resposta: 'A maioria dos eventos começa e termina no horário local de quem joga, e não no horário de Brasília. Por isso as notícias mostram o horário como "horário local de quem joga".' },
    { pergunta: 'Como saber quais eventos estão acabando?', resposta: 'Na página inicial, use o filtro "Acabam logo". Ele lista só os eventos em andamento ou por vir, do que termina primeiro para o que termina depois.' },
    { pergunta: 'Preciso de conta para ler as notícias?', resposta: 'Não. A conta é opcional e serve para favoritar notícias e montar o seu perfil, com time, nível e Pokémon favoritos.' },
  ],
  en: [
    { pergunta: 'What is the PokeGoGuide Blog?', resposta: 'It is the PokeGoGuide blog with Pokémon GO news and events: what is live right now, what starts soon and what is about to end, in Portuguese and English.' },
    { pergunta: 'How often is the news updated?', resposta: 'Events are fetched automatically several times a day. As soon as a new event shows up at the source, it becomes a news post here, with dates, bonuses and rewards.' },
    { pergunta: 'Where does the event information come from?', resposta: 'Event data comes from LeekDuck, and every post links to the original source. Articles are written by the PokeGoGuide team.' },
    { pergunta: 'What time do Pokémon GO events start?', resposta: 'Most events start and end at the player\'s local time, not at a single global time. That is why posts show the time as "local time of the player".' },
    { pergunta: 'How can I see which events are ending soon?', resposta: 'On the home page, use the "Ending soon" filter. It lists only events that are running or upcoming, from the one that ends first to the one that ends last.' },
    { pergunta: 'Do I need an account to read the news?', resposta: 'No. An account is optional and lets you favorite posts and build your profile, with team, level and favorite Pokémon.' },
  ],
};
