'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { spriteDe } from '../lib/formato.ts';

interface Item { dex: number; nome: string }
let cache: Item[] | null = null;

/** Lista de nomes da PokeAPI (uma vez por visita). */
export function usePokedex(): Item[] {
  const [lista, setLista] = useState<Item[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
      .then((r) => r.json() as Promise<{ results: { name: string; url: string }[] }>)
      .then((j) => {
        cache = j.results.map((p) => ({ dex: Number(p.url.split('/').filter(Boolean).pop()), nome: p.name.replace(/-/g, ' ') }));
        setLista(cache);
      })
      .catch(() => {});
  }, []);
  return lista;
}

interface Props {
  rotuloBusca: string;
  max: number;
  selecionados: number[];
  aoMudar: (v: number[]) => void;
}

export function PokemonPicker({ rotuloBusca, max, selecionados, aoMudar }: Props) {
  const pokedex = usePokedex();
  const [busca, setBusca] = useState('');
  const nomes = useMemo(() => new Map(pokedex.map((p) => [p.dex, p.nome])), [pokedex]);
  const achados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return [];
    return pokedex.filter((p) => p.nome.includes(q) || String(p.dex) === q).slice(0, 12);
  }, [busca, pokedex]);

  const alternar = (dex: number) => {
    if (max === 1) return aoMudar([dex]);
    if (selecionados.includes(dex)) return aoMudar(selecionados.filter((d) => d !== dex));
    if (selecionados.length < max) aoMudar([...selecionados, dex]);
  };

  return (
    <div className="space-y-3">
      {selecionados.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selecionados.map((dex) => (
            <li key={dex} className="flex items-center gap-1 rounded-full border border-line bg-raised py-0.5 pl-1 pr-2 text-sm capitalize">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spriteDe(dex)} alt="" width={32} height={32} loading="lazy" />
              {nomes.get(dex) ?? `#${dex}`}
              <button type="button" onClick={() => aoMudar(selecionados.filter((d) => d !== dex))} aria-label={`remover ${nomes.get(dex) ?? dex}`} className="text-muted hover:text-danger"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={rotuloBusca} aria-label={rotuloBusca} className="campo" />
      {achados.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {achados.map((p) => (
            <li key={p.dex}>
              <button type="button" onClick={() => alternar(p.dex)} className={`botao-suave w-full flex-col !gap-0 !px-1 capitalize ${selecionados.includes(p.dex) ? 'border-tema' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={spriteDe(p.dex)} alt="" width={56} height={56} loading="lazy" />
                <span className="text-xs">{p.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
