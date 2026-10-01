'use client';

import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { evento } from '../lib/analytics.ts';
import { chamar } from '../lib/api.ts';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';

export function FavoritoBotao({ slug, inicial, lingua, compacto = false }: { slug: string; inicial?: boolean; lingua: Lingua; compacto?: boolean }) {
  const t = textos[lingua].post;
  const { usuario } = useAuth();
  const router = useRouter();
  const [fav, setFav] = useState(!!inicial);
  const [ocupado, setOcupado] = useState(false);

  // A página vem do cache sem o usuário: quando o login chega, busca o estado real.
  useEffect(() => {
    if (!usuario) return void setFav(false);
    let vivo = true;
    chamar<{ posts: { slug: string }[] }>('GET', `/posts/favoritos?lang=${lingua}`)
      .then((r) => vivo && setFav(r.posts.some((p) => p.slug === slug)))
      .catch(() => {});
    return () => { vivo = false; };
  }, [usuario, slug, lingua]);

  const alternar = async () => {
    if (!usuario) return router.push(`/${lingua}/entrar`);
    if (ocupado) return;
    const alvo = !fav;
    setFav(alvo); // otimista
    setOcupado(true);
    try {
      await chamar(alvo ? 'PUT' : 'DELETE', `/posts/${slug}/favorito`);
      evento(alvo ? 'favoritar' : 'desfavoritar', { slug });
    } catch {
      setFav(!alvo);
    } finally {
      setOcupado(false);
    }
  };

  const rotulo = !usuario ? t.entrarParaFavoritar : fav ? t.desfavoritar : t.favoritar;
  return (
    <motion.button
      onClick={() => void alternar()}
      whileTap={{ scale: 0.85 }}
      aria-pressed={fav}
      aria-label={rotulo}
      title={rotulo}
      className={compacto ? 'rounded-full p-1.5 text-muted hover:bg-highlight' : 'botao-suave'}
    >
      <motion.span key={String(fav)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }} className="flex">
        <Heart size={compacto ? 18 : 20} className={fav ? 'fill-brand text-brand' : ''} />
      </motion.span>
      {!compacto && <span>{rotulo}</span>}
    </motion.button>
  );
}
