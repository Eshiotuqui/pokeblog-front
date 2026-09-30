'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { chamar, ErroApi, type Usuario } from '../lib/api.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';

type Resposta = { usuario: Usuario } | { mfaObrigatorio: true; ticket: string };

export function AuthForm({ lingua, modo, destino }: { lingua: Lingua; modo: 'entrar' | 'cadastro'; destino: string }) {
  const t = textos[lingua];
  const router = useRouter();
  const { definir } = useAuth();
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  /** Depois da senha, contas com MFA passam por uma segunda etapa. */
  const [ticket, setTicket] = useState<string | null>(null);
  const cadastro = modo === 'cadastro';

  const concluir = (u: Usuario) => {
    definir(u);
    router.push(destino);
    router.refresh();
  };
  const falhou = (x: unknown) => {
    if (x instanceof ErroApi && x.codigo === 'TICKET_INVALIDO') { setTicket(null); setErro(t.seg.ticketVencido); return; }
    setErro(x instanceof Error && x.message !== 'Erro' ? x.message : t.auth.erro);
  };

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErro('');
    setOcupado(true);
    try {
      if (ticket) {
        const r = await chamar<{ usuario: Usuario }>('POST', '/auth/mfa/verificar', { ticket, codigo: String(f.get('codigo') ?? '').trim() });
        return concluir(r.usuario);
      }
      const corpo = { email: f.get('email'), password: f.get('password'), ...(cadastro ? { name: f.get('name') } : {}) };
      const r = await chamar<Resposta>('POST', cadastro ? '/auth/register' : '/auth/login', corpo);
      if ('mfaObrigatorio' in r) setTicket(r.ticket);
      else concluir(r.usuario);
    } catch (x) {
      falhou(x);
    } finally {
      setOcupado(false);
    }
  };

  if (ticket) {
    return (
      <form onSubmit={(e) => void enviar(e)} className="card mx-auto w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-extrabold">{t.seg.loginTitulo}</h1>
        <p className="text-sm text-muted">{t.seg.loginTexto}</p>
        <label className="block space-y-1 text-sm font-medium">{t.seg.loginCodigo}
          <input name="codigo" required autoFocus inputMode="text" autoComplete="one-time-code" maxLength={11} spellCheck={false} className="campo text-center text-xl tracking-widest" />
        </label>
        {erro && <p role="alert" className="text-sm font-medium text-danger">{erro}</p>}
        <button className="botao w-full" disabled={ocupado}>{t.seg.entrar}</button>
        <button type="button" className="botao-suave w-full" onClick={() => { setTicket(null); setErro(''); }}>{t.seg.voltar}</button>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="card mx-auto w-full max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-extrabold">{cadastro ? t.auth.criar : t.auth.entrar}</h1>
      {cadastro && (
        <label className="block space-y-1 text-sm font-medium">{t.auth.nome}
          <input name="name" required minLength={2} maxLength={40} autoComplete="nickname" className="campo" />
        </label>
      )}
      <label className="block space-y-1 text-sm font-medium">{t.auth.email}
        <input name="email" type="email" required autoComplete="email" maxLength={200} className="campo" />
      </label>
      <label className="block space-y-1 text-sm font-medium">{t.auth.senha}
        <input name="password" type="password" required minLength={cadastro ? 10 : 1} maxLength={128} autoComplete={cadastro ? 'new-password' : 'current-password'} className="campo" />
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
