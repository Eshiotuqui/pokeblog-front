'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import type { Post } from '../lib/api.ts';
import { dataDaPostagem, urlSegura } from '../lib/formato.ts';
import { textos, type Lingua } from '../lib/i18n.ts';

function Capa({ post, lingua, rotulo, grande, indice }: { post: Post; lingua: Lingua; rotulo: string; grande: boolean; indice: number }) {
  const imagem = urlSegura(post.image);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: indice * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={grande ? 'lg:col-span-2 lg:row-span-2' : ''}
    >
      <Link href={`/${lingua}/noticias/${post.slug}`}
        className={`group relative isolate block overflow-hidden rounded-3xl bg-[#12151c] text-white ${grande ? 'aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[26rem]' : 'aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[12.5rem]'}`}>
        {imagem
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={imagem} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f6b6b] to-[#12151c]" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className={`absolute inset-x-0 bottom-0 space-y-2 ${grande ? 'p-6 sm:p-8' : 'p-4'}`}>
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{rotulo}</span>
          <h2 className={`font-extrabold leading-tight tracking-tight ${grande ? 'text-2xl sm:text-4xl' : 'line-clamp-2 text-base sm:text-lg'}`}>{post.title}</h2>
          {grande && <p className="hidden text-sm text-white/80 sm:block">{dataDaPostagem(post.publishedAt, lingua)}</p>}
        </div>
      </Link>
    </motion.div>
  );
}

/** Abertura da home: uma matéria grande e duas menores ao lado. */
export function Mosaico({ posts, lingua, rotulos }: { posts: Post[]; lingua: Lingua; rotulos: Record<string, string> }) {
  const t = textos[lingua];
  return (
    <section aria-label={t.lateral.destaque} className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
      {posts.map((p, i) => <Capa key={p.id} post={p} lingua={lingua} rotulo={rotulos[p.category] ?? p.category} grande={i === 0} indice={i} />)}
    </section>
  );
}
