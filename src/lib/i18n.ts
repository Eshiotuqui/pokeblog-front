export const LINGUAS = ['pt', 'en'] as const;
export type Lingua = (typeof LINGUAS)[number];
export const ehLingua = (v: string): v is Lingua => (LINGUAS as readonly string[]).includes(v);

const pt = {
  titulo: 'PokeGoGuide Blog',
  descricao: 'Notícias e eventos do Pokémon GO, atualizados sozinhos e em português.',
  nav: { noticias: 'Notícias', favoritos: 'Favoritos', perfil: 'Perfil', admin: 'Admin', entrar: 'Entrar', sair: 'Sair', cadastrar: 'Criar conta' },
  feed: { buscar: 'Buscar notícias…', todas: 'Todas', vazio: 'Nenhuma notícia encontrada.', instavel: 'Estamos com instabilidade para carregar as notícias. Tente de novo em instantes.', tentar: 'Tentar de novo', anterior: 'Anterior', proxima: 'Próxima', pagina: 'Página' },
  post: { voltar: 'Voltar', fonte: 'Ver fonte original', quando: 'Quando', inicio: 'Começa', fim: 'Termina', horaLocal: 'horário local de quem joga', outraLingua: 'Este texto ainda não existe em português; mostrando em inglês.', favoritar: 'Favoritar', desfavoritar: 'Remover dos favoritos', entrarParaFavoritar: 'Entre para favoritar', naoEncontrada: 'Notícia não encontrada.', automatica: 'Automática', manual: 'Editorial' },
  auth: { email: 'E-mail', senha: 'Senha', nome: 'Como quer ser chamado', entrar: 'Entrar', criar: 'Criar conta', semConta: 'Ainda não tem conta?', temConta: 'Já tem conta?', erro: 'Algo deu errado. Tente de novo.', senhaDica: 'Mínimo de 8 caracteres.' },
  perfil: { titulo: 'Seu perfil', time: 'Seu time', semTime: 'Sem time', bio: 'Sobre você', nivel: 'Nível', pokemons: 'Pokémon favoritos (até 6)', avatar: 'Foto de perfil (escolha um Pokémon)', salvar: 'Salvar', salvo: 'Salvo!', buscarPokemon: 'Buscar Pokémon…', entrarAviso: 'Entre para ver seu perfil.', times: { valor: 'Valor', mystic: 'Mystic', instinct: 'Instinct' } },
  favoritos: { titulo: 'Suas notícias favoritas', vazio: 'Você ainda não favoritou nada. Toque no coração em qualquer notícia.' },
  admin: { titulo: 'Painel do administrador', nova: 'Nova notícia', buscarAgora: 'Buscar eventos agora', buscando: 'Buscando… (pode levar alguns minutos)', resultado: 'Lidos: {lidos} · novos: {novos} · matérias completas: {materias}',
    jaRodando: 'Já há uma busca em andamento; acompanhando.',
    refazer: 'Refazer matérias', refazerAjuda: 'Marca todos os posts automáticos para buscar a matéria de novo e já refaz 12. O resto sai a cada "Buscar eventos agora" (12 por vez) ou no ciclo automático. Textos que você editou não mudam.', editar: 'Editar', excluir: 'Excluir', confirmarExcluir: 'Excluir esta notícia?', categoria: 'Categoria', status: 'Status', publicada: 'Publicada', rascunho: 'Rascunho', tituloCampo: 'Título', resumo: 'Resumo (opcional)', texto: 'Texto', textoAjuda: 'Parágrafos separados por linha em branco; linhas começando com "- " viram lista; "## " cria um título; "@ Nome | url da imagem | s" cria um cartão de Pokémon.', imagem: 'URL da imagem', link: 'Link de origem', inicio: 'Início (AAAA-MM-DDTHH:MM)', fim: 'Fim', salvar: 'Salvar notícia', acesso: 'Área restrita ao administrador.', origem: 'Origem', fixar: 'Fixar como aviso na barra lateral' },
  lateral: { recentes: 'Recentes', populares: 'Populares', agora: 'Acontecendo agora', breve: 'Em breve', avisos: 'Avisos', ferramentas: 'Ferramentas', ferramentasTexto: 'Calculadora de IV, raids, ovos, rankings e mais no PokeGoGuide.', abrirSite: 'Abrir o PokeGoGuide', vazio: 'Nada por aqui ainda.', ultimos: 'Últimos Conteúdos', destaque: 'Em destaque', leiaMais: 'Leia mais', visualizacoes: 'visualizações', ate: 'até', tambem: 'Leia também', pokemon: 'Pokémon', shiny: 'Pode ser shiny' },
  materia: { etapa: 'Etapa', recompensas: 'Recompensas', possiveis: 'Recompensas possíveis', rank: 'Rank', basico: 'Básico', deluxe: 'Deluxe', pc: 'PC', ordem: 'Ordenar', recentes: 'Mais recentes', acabam: 'Acabam logo', ate: 'Termina' },
  rodape: 'Sem vínculo com Niantic, Nintendo ou The Pokémon Company.',
  tema: 'Alternar tema',
};

const en: typeof pt = {
  titulo: 'PokeGoGuide Blog',
  descricao: 'Pokémon GO news and events, updated automatically.',
  nav: { noticias: 'News', favoritos: 'Favorites', perfil: 'Profile', admin: 'Admin', entrar: 'Log in', sair: 'Log out', cadastrar: 'Sign up' },
  feed: { buscar: 'Search news…', todas: 'All', vazio: 'No news found.', instavel: 'We are having trouble loading the news. Please try again shortly.', tentar: 'Try again', anterior: 'Previous', proxima: 'Next', pagina: 'Page' },
  post: { voltar: 'Back', fonte: 'View original source', quando: 'When', inicio: 'Starts', fim: 'Ends', horaLocal: "player's local time", outraLingua: 'This text is not available in English yet; showing Portuguese.', favoritar: 'Favorite', desfavoritar: 'Remove from favorites', entrarParaFavoritar: 'Log in to favorite', naoEncontrada: 'Article not found.', automatica: 'Automatic', manual: 'Editorial' },
  auth: { email: 'Email', senha: 'Password', nome: 'What should we call you', entrar: 'Log in', criar: 'Create account', semConta: "Don't have an account?", temConta: 'Already have an account?', erro: 'Something went wrong. Try again.', senhaDica: 'At least 8 characters.' },
  perfil: { titulo: 'Your profile', time: 'Your team', semTime: 'No team', bio: 'About you', nivel: 'Level', pokemons: 'Favorite Pokémon (up to 6)', avatar: 'Profile picture (pick a Pokémon)', salvar: 'Save', salvo: 'Saved!', buscarPokemon: 'Search Pokémon…', entrarAviso: 'Log in to see your profile.', times: { valor: 'Valor', mystic: 'Mystic', instinct: 'Instinct' } },
  favoritos: { titulo: 'Your favorite news', vazio: "You haven't favorited anything yet. Tap the heart on any article." },
  admin: { titulo: 'Admin panel', nova: 'New article', buscarAgora: 'Fetch events now', buscando: 'Fetching… (may take a few minutes)', resultado: 'Read: {lidos} · new: {novos} · full articles: {materias}',
    jaRodando: 'A fetch is already running; following it.',
    refazer: 'Rebuild articles', refazerAjuda: 'Marks all automatic posts to fetch their article again and rebuilds 12 now. The rest go on each "Fetch events now" (12 at a time) or the automatic cycle. Text you edited is kept.', editar: 'Edit', excluir: 'Delete', confirmarExcluir: 'Delete this article?', categoria: 'Category', status: 'Status', publicada: 'Published', rascunho: 'Draft', tituloCampo: 'Title', resumo: 'Summary (optional)', texto: 'Text', textoAjuda: 'Paragraphs separated by a blank line; lines starting with "- " become a list; "## " makes a heading; "@ Name | image url | s" makes a Pokémon card.', imagem: 'Image URL', link: 'Source link', inicio: 'Start (YYYY-MM-DDTHH:MM)', fim: 'End', salvar: 'Save article', acesso: 'Restricted to the administrator.', origem: 'Source', fixar: 'Pin as a notice in the sidebar' },
  lateral: { recentes: 'Recent', populares: 'Popular', agora: 'Happening now', breve: 'Coming soon', avisos: 'Notices', ferramentas: 'Tools', ferramentasTexto: 'IV calculator, raids, eggs, rankings and more on PokeGoGuide.', abrirSite: 'Open PokeGoGuide', vazio: 'Nothing here yet.', ultimos: 'Latest Posts', destaque: 'Featured', leiaMais: 'Read more', visualizacoes: 'views', ate: 'until', tambem: 'Read also', pokemon: 'Pokémon', shiny: 'Can be shiny' },
  materia: { etapa: 'Step', recompensas: 'Rewards', possiveis: 'Possible rewards', rank: 'Rank', basico: 'Basic', deluxe: 'Deluxe', pc: 'CP', ordem: 'Sort', recentes: 'Most recent', acabam: 'Ending soon', ate: 'Ends' },
  rodape: 'Not affiliated with Niantic, Nintendo or The Pokémon Company.',
  tema: 'Toggle theme',
};

export const textos: Record<Lingua, typeof pt> = { pt, en };
export type Textos = typeof pt;
export const localeDe = (l: Lingua) => (l === 'pt' ? 'pt-BR' : 'en-US');
