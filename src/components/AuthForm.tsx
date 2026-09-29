'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { chamar, type Usuario } from '../lib/api.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';

export function AuthForm({ lingua, modo }: { lingua: Lingua; modo: 'entrar' | 'cadastro' }) {
  const t = textos[lingua];
  const router = useRouter();
  const { definir } = useAuth();
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const cadastro = modo === 'cadastro';

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErro('');
    setOcupado(true);
    try {
      const corpo = { email: f.get('email'), password: f.get('password'), ...(cadastro ? { name: f.get('name') } : {}) };
      const r = await chamar<{ usuario: Usuario }>('POST', cadastro ? '/auth/register' : '/auth/login', corpo);
      definir(r.usuario);
      router.push(`/${lingua}`);
      router.refresh();
    } catch (x) {
      setErro(x instanceof Error && x.message !== 'Erro' ? x.message : t.auth.erro);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form onSubmit={(e) => void enviar(e)} className="card mx-auto w-full max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-extrabold">{cadastro ? t.auth.criar : t.auth.entrar}</h1>
      {cadastro && (
        <label className="block space-y-1 text-sm font-medium">{t.auth.nome}
          <input name="name" required minLength={2} maxLength={40} autoComplete="nickname" className="campo" />
        </label>
      )}
      <label className="block space-y-1 text-sm font-medium">{t.auth.email}
        <input name="email" type="email" required autoComplete="email" className="campo" />
      </label>
      <label className="block space-y-1 text-sm font-medium">{t.auth.senha}
        <input name="password" type="password" required minLength={cadastro ? 8 : 1} autoComplete={cadastro ? 'new-password' : 'current-password'} className="campo" />
        {cadastro && <span className="block text-xs text-muted">{t.auth.senhaDica}</span>}
      </label>
      {erro && <p role="alert" className="text-sm font-medium text-danger">{erro}</p>}
      <button className="botao w-full" disabled={ocupado}>{cadastro ? t.auth.criar : t.auth.entrar}</button>
      <p className="text-center text-sm text-muted">
        {cadastro ? t.auth.temConta : t.auth.semConta}{' '}
        <Link href={`/${lingua}/${cadastro ? 'entrar' : 'cadastro'}`} className="font-semibold text-tema underline">{cadastro ? t.auth.entrar : t.auth.criar}</Link>
      </p>
    </form>
  );
}
