/**
 * Eventos do Google Analytics, além das visualizações de página.
 *
 * Sem o GA ligado (`NEXT_PUBLIC_GA_ID` vazio, ou o navegador bloqueou o
 * script), não faz nada. O que for enviado antes de o script do Google chegar
 * fica na fila do `gtag` e vai junto quando ele carregar.
 *
 * Os nomes e parâmetros ficam em português e minúsculas, como o GA pede
 * (`ir_para_guia`, `origem`); `sign_up` e `login` são os nomes que o GA já
 * reconhece e mostra nos relatórios prontos.
 */
export type ParametrosDoEvento = Record<string, string | number | boolean>;

// O que chega antes de o `Analytics` ligar o GA. Acontece no carregamento: o efeito de um componente da
// página (o `ver_noticia`) roda antes do efeito do layout, que é onde o GA liga.
const pendentes: [string, ParametrosDoEvento][] = [];

export function evento(nome: string, parametros: ParametrosDoEvento = {}): void {
  if (typeof window === 'undefined') return;
  if (window.gtag) window.gtag('event', nome, parametros);
  else pendentes.push([nome, parametros]);
}

/** Chamado pelo `Analytics` logo depois do `config`: manda o que ficou esperando. */
export function enviarPendentes(): void {
  for (const [nome, parametros] of pendentes.splice(0)) window.gtag?.('event', nome, parametros);
}

/**
 * Atributos que transformam um link em evento, sem precisar de JavaScript
 * no componente (serve em componente de servidor): `data-evento` é o nome,
 * e cada `data-*` restante vira parâmetro. Quem escuta o clique é o
 * `Analytics`.
 *
 *   <a href="…" {...rastreio('ir_para_guia', { origem: 'noticia' })}>
 */
export function rastreio(nome: string, parametros: Record<string, string> = {}): Record<string, string> {
  return {
    'data-evento': nome,
    ...Object.fromEntries(Object.entries(parametros).map(([k, v]) => [`data-${k.replace(/_/g, '-')}`, v])),
  };
}
