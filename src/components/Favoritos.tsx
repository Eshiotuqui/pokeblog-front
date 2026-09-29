'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { chamar, type Categoria, type Post } from '../lib/api.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';
import { PostCard } from './PostCard.tsx';

export function Favoritos({ lingua, categorias }: { lingua: Lingua; categorias: Categoria[] }) {
  const t = textos[lingua];
  const { usuario, carregando } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    if (!usuario) return;
    chamar<{ posts: Post[] }>('GET', `/posts/favoritos?lang=${lingua}`).then((r) => setPosts(r.posts)).catch(() => setPosts([]));
  }, [usuario, lingua]);

  if (carregando || (usuario && !posts)) return <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="esqueleto h-56" />)}</div>;
  if (!usuario) return <p className="card p-6">{t.perfil.entrarAviso} <Link className="font-semibold text-tema underline" href={`/${lingua}/entrar`}>{t.nav.entrar}</Link></p>;
  if (!posts?.length) return <p className="card p-6 text-muted">{t.favoritos.vazio}</p>;
  const rotulo = (id: string) => categorias.find((c) => c.id === id)?.[lingua] ?? id;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((p, i) => <PostCard key={p.id} post={p} lingua={lingua} rotulo={rotulo(p.category)} indice={i} />)}
    </div>
  );
}
