import type { ReactNode } from 'react';
import { urlSegura } from '../lib/formato.ts';
import type { Textos } from '../lib/i18n.ts';

/* eslint-disable @next/next/no-img-element */
const Icone = ({ src, tamanho = 40 }: { src: string; tamanho?: number }) => {
  const u = urlSegura(src);
  return u ? <img src={u} alt="" loading="lazy" width={tamanho} height={tamanho} className="shrink-0 object-contain" style={{ width: tamanho, height: tamanho }} /> : null;
};

const campos = (l: string) => l.slice(2).split('|').map((x) => x.trim());
const comMarca = (linhas: string[], m: string) => linhas.filter((l) => l.startsWith(m));

/** Etapa de uma pesquisa: "% n | nome", tarefas "> tarefa | recompensa | img", prêmio "+ nome | img". */
function Etapa({ linhas, t }: { linhas: string[]; t: Textos['materia'] }) {
  const [num = '', nome = ''] = campos(linhas[0]!);
  const premios = comMarca(linhas, '+ ').map(campos);
  return (
    <div className="card grid gap-0 overflow-hidden sm:grid-cols-[1fr_auto]">
      <div className="p-4">
        <p className="mb-2 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-tema font-extrabold text-bg" aria-label={`${t.etapa} ${num}`}>{num}</span>
          <span className="font-bold">{nome}</span>
        </p>
        <ul className="divide-y divide-line/70">
          {comMarca(linhas, '> ').map((l, i) => {
            const [tarefa = '', premio = '', img = ''] = campos(l);
            return (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-[0.95rem]">
                <span className="font-medium">{tarefa}</span>
                <span className="flex shrink-0 items-center gap-2 text-sm text-muted"><Icone src={img} tamanho={32} />{premio}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {premios.length > 0 && (
        <div className="border-t border-line bg-raised p-4 sm:border-l sm:border-t-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-tema">{t.recompensas}</p>
          <ul className="flex flex-wrap gap-3 sm:max-w-[16rem]">
            {premios.map(([nomeP = '', img = ''], i) => (
              <li key={i} className="flex w-[4.5rem] flex-col items-center text-center text-xs leading-tight"><Icone src={img} tamanho={44} /><span className="mt-1">{nomeP}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Pesquisa de campo: "? tarefa" e recompensas possíveis "+ nome | img | s | PC". */
function Campo({ linhas, t }: { linhas: string[]; t: Textos['materia'] }) {
  return (
    <div className="card p-4">
      <p className="font-bold">{linhas[0]!.slice(2)}</p>
      <p className="mb-2 mt-1 text-xs font-bold uppercase tracking-widest text-tema">{t.possiveis}</p>
      <ul className="flex flex-wrap gap-3">
        {comMarca(linhas, '+ ').map((l, i) => {
          const [nome = '', img = '', shiny = '', pc = ''] = campos(l);
          return (
            <li key={i} className="flex w-24 flex-col items-center rounded-2xl bg-raised p-2 text-center text-xs leading-tight">
              <Icone src={img} tamanho={56} />
              <span className="mt-1 font-semibold">{nome}{shiny === 's' && <span title="shiny" className="text-tema"> ✦</span>}</span>
              {pc && <span className="text-muted">{t.pc} {pc}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Passe: uma linha por rank, "# rank | básico | deluxe". */
function Passe({ linhas, t }: { linhas: string[]; t: Textos['materia'] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-raised text-xs uppercase tracking-widest text-muted">
          <tr><th className="px-4 py-2">{t.rank}</th><th className="px-4 py-2">{t.basico}</th><th className="px-4 py-2">{t.deluxe}</th></tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {linhas.map((l, i) => {
            const [rank = '', basico = '', deluxe = ''] = campos(l);
            return (
              <tr key={i} className="align-top">
                <td className="px-4 py-2 font-extrabold text-tema">{rank}</td>
                <td className="px-4 py-2">{basico || '—'}</td>
                <td className="px-4 py-2">{deluxe || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renderiza o texto da notícia: títulos ("## "), parágrafos (linha em branco),
 * listas ("- "), grades de Pokémon ("@ ") e os blocos de pesquisa e passe
 * ("% ", "? ", "# "). É React puro, sem innerHTML: qualquer HTML colado vira
 * texto, então o conteúdo, mesmo o vindo da ingestão automática, não executa nada.
 */
export function Corpo({ texto, rotuloShiny, t }: { texto: string; rotuloShiny: string; t: Textos['materia'] }) {
  const blocos = texto.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  // Blocos de rank consecutivos (um por linha, sem linha em branco entre eles) já vêm juntos.
  return (
    <div className="prosa space-y-4 text-[1.0625rem] leading-relaxed">
      {blocos.map((b, i): ReactNode => {
        const linhas = b.split('\n');
        if (b.startsWith('## ')) return <h2 key={i}>{b.slice(3)}</h2>;
        if (b.startsWith('% ')) return <Etapa key={i} linhas={linhas} t={t} />;
        if (b.startsWith('? ')) return <Campo key={i} linhas={linhas} t={t} />;
        if (linhas.every((l) => l.startsWith('# '))) return <Passe key={i} linhas={linhas} t={t} />;
        if (linhas.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-tema">
              {linhas.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        if (linhas.every((l) => l.startsWith('@ '))) {
          return (
            <ul key={i} className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {linhas.map((l, j) => {
                const [nome = '', img = '', shiny = ''] = campos(l);
                return (
                  <li key={j} className="card flex flex-col items-center p-2 text-center">
                    <Icone src={img} tamanho={72} />
                    <span className="text-sm font-semibold leading-tight">{nome}</span>
                    {shiny === 's' && <span className="mt-1 rounded-full bg-highlight px-2 text-[11px] font-semibold text-tema">✦ {rotuloShiny}</span>}
                  </li>
                );
              })}
            </ul>
          );
        }
        return <p key={i} className="whitespace-pre-line">{b}</p>;
      })}
    </div>
  );
}
