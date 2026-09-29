'use client';

import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { chamar, type Categoria } from '../lib/api.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';

interface PostAdmin {
  id: number; slug: string; source: string; category: string; status: 'published' | 'draft';
  titlePt: string; titleEn: string; summaryPt: string; summaryEn: string; bodyPt: string; bodyEn: string;
  image: string; link: string; eventStart: string; eventEnd: string; publishedAt: string; pinned: boolean;
}
const VAZIO: Omit<PostAdmin, 'id' | 'slug' | 'source' | 'publishedAt'> = {
  category: 'event', status: 'published', titlePt: '', titleEn: '', summaryPt: '', summaryEn: '', bodyPt: '', bodyEn: '',
  image: '', link: '', eventStart: '', eventEnd: '', pinned: false,
};

export function Admin({ lingua, categorias }: { lingua: Lingua; categorias: Categoria[] }) {
  const t = textos[lingua];
  const { usuario, carregando } = useAuth();
  const [posts, setPosts] = useState<PostAdmin[]>([]);
  const [editando, setEditando] = useState<PostAdmin | (typeof VAZIO & { id?: undefined }) | null>(null);
  const [msg, setMsg] = useState('');
  const [buscando, setBuscando] = useState(false);

  const carregar = useCallback(() => {
    chamar<{ posts: PostAdmin[] }>('GET', '/admin/posts').then((r) => setPosts(r.posts)).catch(() => {});
  }, []);
  useEffect(() => { if (usuario?.role === 'admin') carregar(); }, [usuario, carregar]);

  if (carregando) return <div className="esqueleto h-40" />;
  if (usuario?.role !== 'admin') {
    return <p className="card p-6">{t.admin.acesso} <Link className="font-semibold text-tema underline" href={`/${lingua}/entrar`}>{t.nav.entrar}</Link></p>;
  }

  // A busca roda no servidor (traduzir localmente leva minutos): dispara e acompanha.
  const buscarAgora = async (refazer = false) => {
    setBuscando(true);
    setMsg('');
    type Estado = { rodando: boolean; erro: string | null; ultimo: { lidos: number; novos: number; materias: number } | null };
    try {
      const inicio = await chamar<Estado & { iniciou: boolean }>('POST', `/admin/ingest${refazer ? '?refazer=1' : ''}`);
      if (!inicio.iniciou) setMsg(t.admin.jaRodando);
      let e: Estado = inicio;
      while (e.rodando) {
        await new Promise((r) => setTimeout(r, 3000));
        e = await chamar<Estado>('GET', '/admin/ingest');
        carregar();
      }
      if (e.erro) setMsg(e.erro);
      else if (e.ultimo) setMsg(t.admin.resultado.replace('{lidos}', String(e.ultimo.lidos)).replace('{novos}', String(e.ultimo.novos)).replace('{materias}', String(e.ultimo.materias)));
      carregar();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : t.auth.erro);
    } finally {
      setBuscando(false);
    }
  };

  const excluir = async (p: PostAdmin) => {
    if (!confirm(t.admin.confirmarExcluir)) return;
    await chamar('DELETE', `/admin/posts/${p.id}`).catch(() => {});
    carregar();
  };

  if (editando) {
    return <Editor lingua={lingua} categorias={categorias} inicial={editando} aoFechar={() => { setEditando(null); carregar(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-extrabold">{t.admin.titulo}</h1>
        <button onClick={() => void buscarAgora(true)} disabled={buscando} className="botao-suave" title={t.admin.refazerAjuda}>{t.admin.refazer}</button>
        <button onClick={() => void buscarAgora()} disabled={buscando} className="botao-suave">
          <RefreshCw size={16} className={buscando ? 'animate-spin' : ''} />{buscando ? t.admin.buscando : t.admin.buscarAgora}
        </button>
        <button onClick={() => setEditando({ ...VAZIO })} className="botao"><Plus size={16} />{t.admin.nova}</button>
      </div>
      {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
      <ul className="card divide-y divide-line overflow-hidden">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.titlePt || p.titleEn}</p>
              <p className="text-xs text-muted">
                {categorias.find((c) => c.id === p.category)?.[lingua] ?? p.category} · {p.source === 'auto' ? t.post.automatica : t.post.manual} · {p.status === 'draft' ? t.admin.rascunho : t.admin.publicada}
              </p>
            </div>
            <button onClick={() => setEditando(p)} className="botao-suave" aria-label={t.admin.editar}><Pencil size={16} /></button>
            <button onClick={() => void excluir(p)} className="botao-suave text-danger" aria-label={t.admin.excluir}><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({ lingua, categorias, inicial, aoFechar }: {
  lingua: Lingua; categorias: Categoria[]; inicial: PostAdmin | (typeof VAZIO & { id?: undefined }); aoFechar: () => void;
}) {
  const t = textos[lingua].admin;
  const [f, setF] = useState(inicial);
  const [aba, setAba] = useState<Lingua>(lingua);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const set = (k: string, v: string | boolean) => setF({ ...f, [k]: v });
  const sufixo = aba === 'pt' ? 'Pt' : 'En';
  const campo = (base: string) => `${base}${sufixo}` as 'titlePt';

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    const { category, status, titlePt, titleEn, summaryPt, summaryEn, bodyPt, bodyEn, image, link, eventStart, eventEnd, pinned } = f;
    const corpo = { category, status, titlePt, titleEn, summaryPt, summaryEn, bodyPt, bodyEn, image, link, eventStart, eventEnd, pinned };
    try {
      await (f.id ? chamar('PUT', `/admin/posts/${f.id}`, corpo) : chamar('POST', '/admin/posts', corpo));
      aoFechar();
    } catch (x) {
      setErro(x instanceof Error ? x.message : textos[lingua].auth.erro);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form onSubmit={(e) => void salvar(e)} className="card space-y-4 p-5">
      <div className="flex gap-2" role="tablist">
        {(['pt', 'en'] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={aba === l} onClick={() => setAba(l)}
            className={`botao-suave uppercase ${aba === l ? 'border-tema text-tema' : ''}`}>{l}
            {(l === 'pt' ? f.titlePt : f.titleEn) ? ' ✓' : ''}</button>
        ))}
      </div>
      <label className="block space-y-1 text-sm font-medium">{t.tituloCampo} ({aba.toUpperCase()})
        <input value={f[campo('title')]} onChange={(e) => set(campo('title'), e.target.value)} maxLength={200} className="campo" />
      </label>
      <label className="block space-y-1 text-sm font-medium">{t.resumo} ({aba.toUpperCase()})
        <input value={f[campo('summary')]} onChange={(e) => set(campo('summary'), e.target.value)} maxLength={400} className="campo" />
      </label>
      <label className="block space-y-1 text-sm font-medium">{t.texto} ({aba.toUpperCase()})
        <textarea value={f[campo('body')]} onChange={(e) => set(campo('body'), e.target.value)} rows={14} className="campo font-mono text-sm" />
        <span className="block text-xs text-muted">{t.textoAjuda}</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium">{t.categoria}
          <select value={f.category} onChange={(e) => set('category', e.target.value)} className="campo">
            {categorias.map((c) => <option key={c.id} value={c.id}>{c[lingua]}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">{t.status}
          <select value={f.status} onChange={(e) => set('status', e.target.value)} className="campo">
            <option value="published">{t.publicada}</option>
            <option value="draft">{t.rascunho}</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">{t.imagem}
          <input value={f.image} onChange={(e) => set('image', e.target.value)} type="url" className="campo" />
        </label>
        <label className="block space-y-1 text-sm font-medium">{t.link}
          <input value={f.link} onChange={(e) => set('link', e.target.value)} type="url" className="campo" />
        </label>
        <label className="block space-y-1 text-sm font-medium">{t.inicio}
          <input value={f.eventStart} onChange={(e) => set('eventStart', e.target.value)} placeholder="2026-10-05T10:00" className="campo" />
        </label>
        <label className="block space-y-1 text-sm font-medium">{t.fim}
          <input value={f.eventEnd} onChange={(e) => set('eventEnd', e.target.value)} placeholder="2026-10-05T17:00" className="campo" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={f.pinned} onChange={(e) => set('pinned', e.target.checked)} className="size-4 accent-[var(--color-brand)]" />{t.fixar}
      </label>
      {erro && <p role="alert" className="text-sm font-medium text-danger">{erro}</p>}
      <div className="flex gap-2">
        <button className="botao" disabled={ocupado}>{t.salvar}</button>
        <button type="button" className="botao-suave" onClick={aoFechar}>{textos[lingua].post.voltar}</button>
      </div>
    </form>
  );
}
