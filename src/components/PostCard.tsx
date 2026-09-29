'use client';

import { CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { Post } from '../lib/api.ts';
import { dataDoEvento, urlSegura } from '../lib/formato.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { FavoritoBotao } from './FavoritoBotao.tsx';

export function PostCard({ post, lingua, rotulo, indice = 0, mostrarFim = false }: { post: Post; lingua: Lingua; rotulo: string; indice?: number; mostrarFim?: boolean }) {
  const t = textos[lingua];
  const imagem = urlSegura(post.image);
  const inicio = mostrarFim ? dataDoEvento(post.eventEnd, lingua) : dataDoEvento(post.eventStart, lingua);
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(indice, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="card group relative flex flex-col overflow-hidden rounded-3xl"
    >
      <Link href={`/${lingua}/noticias/${post.slug}`} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/9] overflow-hidden bg-highlight">
        {imagem
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={imagem} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="grid h-full place-items-center bg-gradient-to-br from-tema/30 to-highlight text-4xl text-tema">◓</div>}
        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-0.5 text-xs font-semibold text-tema backdrop-blur">{rotulo}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold leading-snug">
          <Link href={`/${lingua}/noticias/${post.slug}`} className="after:absolute after:inset-0 after:content-['']">{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted">{post.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
          {inicio ? <span className="flex items-center gap-1"><CalendarDays size={14} />{mostrarFim ? `${t.materia.ate}: ` : ''}{inicio}</span> : <span />}
          <span className="relative z-10"><FavoritoBotao slug={post.slug} inicial={post.favorito} lingua={lingua} compacto /></span>
        </div>
        {post.lingua !== lingua && post.source === 'admin' && <p className="text-xs text-muted">{t.post.outraLingua}</p>}
      </div>
    </motion.article>
  );
}
