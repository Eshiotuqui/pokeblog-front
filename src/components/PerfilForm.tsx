'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { chamar, type Usuario } from '../lib/api.ts';
import { spriteDe } from '../lib/formato.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';
import { PokemonPicker } from './PokemonPicker.tsx';

const TIMES = [
  { id: 'valor', cor: '#e5453b' },
  { id: 'mystic', cor: '#2f7be5' },
  { id: 'instinct', cor: '#e5b81f' },
] as const;

export function PerfilForm({ lingua }: { lingua: Lingua }) {
  const t = textos[lingua];
  const { usuario, carregando, definir } = useAuth();
  const [form, setForm] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<'' | 'salvando' | 'salvo' | 'erro'>('');

  useEffect(() => { if (usuario) setForm(usuario); }, [usuario]);

  if (carregando) return <div className="esqueleto h-64" />;
  if (!usuario || !form) {
    return <p className="card p-6">{t.perfil.entrarAviso} <Link className="font-semibold text-tema underline" href={`/${lingua}/entrar`}>{t.nav.entrar}</Link></p>;
  }

  const salvar = async () => {
    setEstado('salvando');
    try {
      const r = await chamar<{ usuario: Usuario }>('PATCH', '/auth/me', {
        name: form.name, team: form.team, bio: form.bio, avatarDex: form.avatarDex,
        trainerLevel: form.trainerLevel, favoritePokemon: form.favoritePokemon,
      });
      definir(r.usuario);
      setEstado('salvo');
    } catch {
      setEstado('erro');
    }
  };

  const set = <K extends keyof Usuario>(k: K, v: Usuario[K]) => { setForm({ ...form, [k]: v }); setEstado(''); };

  return (
    <div className="card space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="grid size-20 place-items-center overflow-hidden rounded-full border border-line bg-raised">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {form.avatarDex ? <img src={spriteDe(form.avatarDex)} alt="" width={80} height={80} /> : <span className="text-3xl font-extrabold text-muted">{form.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{t.perfil.titulo}</h1>
          <p className="text-sm text-muted">{usuario.email}</p>
        </div>
      </div>

      <label className="block space-y-1 text-sm font-medium">{t.auth.nome}
        <input value={form.name} onChange={(e) => set('name', e.target.value)} minLength={2} maxLength={40} className="campo" />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t.perfil.time}</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set('team', null)} aria-pressed={form.team === null} className={`botao-suave ${form.team === null ? 'border-tema' : ''}`}>{t.perfil.semTime}</button>
          {TIMES.map((x) => (
            <button key={x.id} type="button" onClick={() => set('team', x.id)} aria-pressed={form.team === x.id} className={`botao-suave ${form.team === x.id ? 'border-tema' : ''}`}>
              <span className="size-3 rounded-full" style={{ background: x.cor }} />
              {t.perfil.times[x.id]}
              {form.team === x.id && <Check size={16} />}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1 text-sm font-medium">{t.perfil.nivel}
        <input type="number" inputMode="numeric" min={1} max={80} placeholder="1–80" value={form.trainerLevel ?? ''} onChange={(e) => set('trainerLevel', e.target.value ? Math.min(80, Math.max(1, Number(e.target.value))) : null)} className="campo block w-28" />
      </label>

      <label className="block space-y-1 text-sm font-medium">{t.perfil.bio}
        <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} maxLength={280} rows={3} className="campo" />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t.perfil.pokemons}</p>
        <PokemonPicker rotuloBusca={t.perfil.buscarPokemon} max={6} selecionados={form.favoritePokemon} aoMudar={(v) => set('favoritePokemon', v)} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t.perfil.avatar}</p>
        <PokemonPicker rotuloBusca={t.perfil.buscarPokemon} max={1} selecionados={form.avatarDex ? [form.avatarDex] : []} aoMudar={(v) => set('avatarDex', v[0] ?? null)} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => void salvar()} disabled={estado === 'salvando'} className="botao">{t.perfil.salvar}</button>
        {estado === 'salvo' && <span role="status" className="text-sm font-medium text-success">{t.perfil.salvo}</span>}
        {estado === 'erro' && <span role="alert" className="text-sm font-medium text-danger">{t.auth.erro}</span>}
      </div>
    </div>
  );
}
