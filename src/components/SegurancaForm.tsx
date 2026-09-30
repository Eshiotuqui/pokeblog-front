'use client';

import { Check, Copy, Download, KeyRound, LogOut, ShieldCheck, ShieldOff } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState, type FormEvent } from 'react';
import { chamar, type Usuario } from '../lib/api.ts';
import { BASE } from '../lib/base.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';

type Etapa = 'repouso' | 'escanear' | 'codigos' | 'desativar' | 'novos';

const msg = (x: unknown, padrao: string) => (x instanceof Error && x.message !== 'Erro' ? x.message : padrao);

/** Segurança da conta: MFA (TOTP), troca de senha e "sair de todos os aparelhos". */
export function SegurancaForm({ lingua }: { lingua: Lingua }) {
  const t = textos[lingua];
  const s = t.seg;
  const { usuario, definir, sair } = useAuth();
  const [etapa, setEtapa] = useState<Etapa>('repouso');
  const [config, setConfig] = useState<{ segredo: string; otpauth: string } | null>(null);
  const [qr, setQr] = useState('');
  const [codigos, setCodigos] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // O QR code é desenhado aqui no navegador: o segredo nunca vai para um serviço de geração de imagem.
  useEffect(() => {
    if (!config) return void setQr('');
    let vivo = true;
    QRCode.toDataURL(config.otpauth, { width: 220, margin: 1, errorCorrectionLevel: 'M' }).then((u) => vivo && setQr(u)).catch(() => {});
    return () => { vivo = false; };
  }, [config]);

  if (!usuario) return null;

  const rodar = async (fn: () => Promise<void>) => {
    setErro(''); setAviso(''); setOcupado(true);
    try { await fn(); } catch (x) { setErro(msg(x, t.auth.erro)); } finally { setOcupado(false); }
  };
  const dados = (e: FormEvent<HTMLFormElement>) => new FormData(e.currentTarget);
  const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
  const voltar = () => { setEtapa('repouso'); setConfig(null); setErro(''); };

  const comecar = () => rodar(async () => { setConfig(await chamar('POST', '/auth/mfa/configurar')); setEtapa('escanear'); });
  const ativar = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = dados(e); return rodar(async () => {
    const r = await chamar<{ codigosDeRecuperacao: string[]; usuario: Usuario }>('POST', '/auth/mfa/ativar', { codigo: texto(f, 'codigo') });
    definir(r.usuario); setCodigos(r.codigosDeRecuperacao); setConfig(null); setEtapa('codigos');
  }); };
  const desativar = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = dados(e); return rodar(async () => {
    const r = await chamar<{ usuario: Usuario }>('POST', '/auth/mfa/desativar', { senha: String(f.get('senha') ?? ''), codigo: texto(f, 'codigo') });
    definir(r.usuario); voltar();
  }); };
  const novos = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = dados(e); return rodar(async () => {
    const r = await chamar<{ codigosDeRecuperacao: string[] }>('POST', '/auth/mfa/codigos', { codigo: texto(f, 'codigo') });
    setCodigos(r.codigosDeRecuperacao); setEtapa('codigos');
  }); };
  const trocarSenha = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; const f = dados(e); return rodar(async () => {
    await chamar('POST', '/auth/senha', { atual: String(f.get('atual') ?? ''), nova: String(f.get('nova') ?? ''), ...(usuario.mfaAtivo ? { codigo: texto(f, 'codigo') } : {}) });
    form.reset(); setAviso(s.trocada);
  }); };
  const sairDeTodos = () => rodar(async () => { await chamar('POST', '/auth/sair-de-todos'); await sair(); window.location.href = `${BASE}/${lingua}/entrar`; });

  const copiar = async () => {
    try { await navigator.clipboard.writeText(codigos.join('\n')); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem permissão da área de transferência */ }
  };
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([`PokeGoGuide Blog — códigos de recuperação\n\n${codigos.join('\n')}\n`], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = 'pokegoguide-codigos-de-recuperacao.txt'; a.click(); URL.revokeObjectURL(url);
  };

  const Erro = () => (erro ? <p role="alert" className="text-sm font-medium text-danger">{erro}</p> : null);
  const campoCodigo = (autoFoco = false) => (
    <label className="block space-y-1 text-sm font-medium">{s.codigo}
      <input name="codigo" required autoFocus={autoFoco} inputMode="numeric" autoComplete="one-time-code" maxLength={11} spellCheck={false} className="campo w-44 text-center text-lg tracking-widest" />
    </label>
  );

  return (
    <section id="seguranca" aria-label={s.titulo} className="card space-y-8 p-6">
      <h2 className="text-2xl font-extrabold">{s.titulo}</h2>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          {usuario.mfaAtivo ? <ShieldCheck className="text-success" size={20} /> : <ShieldOff className="text-muted" size={20} />}
          {s.mfaTitulo}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${usuario.mfaAtivo ? 'bg-success/15 text-success' : 'bg-highlight text-muted'}`}>{usuario.mfaAtivo ? s.ativo : s.inativo}</span>
        </h3>
        <p className="text-sm text-muted">{s.mfaExplica}</p>
        {usuario.mfaObrigatorio && <p role="status" className="rounded-xl border border-brand/40 bg-brand/[0.07] p-3 text-sm font-semibold">{s.obrigatorio}</p>}

        {etapa === 'repouso' && !usuario.mfaAtivo && <button className="botao" disabled={ocupado} onClick={() => void comecar()}><KeyRound size={16} />{s.ativar}</button>}
        {etapa === 'repouso' && usuario.mfaAtivo && (
          <div className="flex flex-wrap gap-2">
            <button className="botao-suave" onClick={() => { setEtapa('novos'); setErro(''); }}>{s.novosCodigos}</button>
            {!(usuario.role === 'admin') && <button className="botao-suave text-danger" onClick={() => { setEtapa('desativar'); setErro(''); }}>{s.desativar}</button>}
          </div>
        )}

        {etapa === 'escanear' && config && (
          <form onSubmit={(e) => void ativar(e)} className="space-y-4 rounded-2xl bg-raised p-4">
            <p className="text-sm font-medium">{s.passo1}</p>
            {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="QR code" width={220} height={220} className="rounded-xl bg-white p-2" />}
            <p className="text-xs text-muted">{s.chave}: <code className="select-all break-all font-mono text-sm text-ink">{config.segredo}</code></p>
            <p className="text-sm font-medium">{s.passo2}</p>
            {campoCodigo(true)}
            <Erro />
            <div className="flex gap-2"><button className="botao" disabled={ocupado}>{s.confirmar}</button><button type="button" className="botao-suave" onClick={voltar}>{s.voltar}</button></div>
          </form>
        )}

        {etapa === 'codigos' && (
          <div className="space-y-3 rounded-2xl border border-tema/50 bg-raised p-4">
            <h4 className="font-bold">{s.guardeTitulo}</h4>
            <p className="text-sm text-muted">{s.guardeTexto}</p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">{codigos.map((c) => <li key={c} className="select-all rounded-lg bg-surface px-2 py-1 text-center">{c}</li>)}</ul>
            <div className="flex flex-wrap gap-2">
              <button className="botao-suave" onClick={() => void copiar()}>{copiado ? <Check size={16} /> : <Copy size={16} />}{copiado ? s.copiado : s.copiar}</button>
              <button className="botao-suave" onClick={baixar}><Download size={16} />{s.baixar}</button>
              <button className="botao" onClick={() => { setCodigos([]); setEtapa('repouso'); }}>{s.guardei}</button>
            </div>
          </div>
        )}

        {etapa === 'desativar' && (
          <form onSubmit={(e) => void desativar(e)} className="space-y-3 rounded-2xl bg-raised p-4">
            <p className="text-sm">{s.desativarTexto}</p>
            <label className="block space-y-1 text-sm font-medium">{s.senha}<input name="senha" type="password" required autoComplete="current-password" className="campo max-w-xs" /></label>
            {campoCodigo()}
            <Erro />
            <div className="flex gap-2"><button className="botao" disabled={ocupado}>{s.desativar}</button><button type="button" className="botao-suave" onClick={voltar}>{s.voltar}</button></div>
          </form>
        )}

        {etapa === 'novos' && (
          <form onSubmit={(e) => void novos(e)} className="space-y-3 rounded-2xl bg-raised p-4">
            <p className="text-sm">{s.novosTexto}</p>
            {campoCodigo(true)}
            <Erro />
            <div className="flex gap-2"><button className="botao" disabled={ocupado}>{s.novosCodigos}</button><button type="button" className="botao-suave" onClick={voltar}>{s.voltar}</button></div>
          </form>
        )}
      </div>

      <form onSubmit={(e) => void trocarSenha(e)} className="space-y-3">
        <h3 className="text-lg font-bold">{s.senhaTitulo}</h3>
        <label className="block space-y-1 text-sm font-medium">{s.senhaAtual}<input name="atual" type="password" required autoComplete="current-password" maxLength={256} className="campo max-w-xs" /></label>
        <label className="block space-y-1 text-sm font-medium">{s.senhaNova}<input name="nova" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="campo max-w-xs" /></label>
        {usuario.mfaAtivo && campoCodigo()}
        <p className="text-xs text-muted">{s.senhaDica}</p>
        {etapa === 'repouso' && <Erro />}
        {aviso && <p role="status" className="text-sm font-medium text-success">{aviso}</p>}
        <button className="botao" disabled={ocupado}>{s.trocar}</button>
      </form>

      <div className="space-y-2">
        <h3 className="text-lg font-bold">{s.aparelhosTitulo}</h3>
        <p className="text-sm text-muted">{s.aparelhosTexto}</p>
        <button className="botao-suave text-danger" disabled={ocupado} onClick={() => void sairDeTodos()}><LogOut size={16} />{s.sairTodos}</button>
      </div>
    </section>
  );
}
