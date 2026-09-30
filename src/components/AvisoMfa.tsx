'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { textos, type Lingua } from '../lib/i18n.ts';
import { useAuth } from './Auth.tsx';

/** Faixa para o administrador que ainda não ativou o MFA (o painel só abre depois). */
export function AvisoMfa({ lingua }: { lingua: Lingua }) {
  const { usuario } = useAuth();
  const caminho = usePathname();
  if (!usuario?.mfaObrigatorio || caminho.endsWith('/perfil')) return null;
  return (
    <div role="status" className="border-b border-brand/30 bg-brand/[0.08]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm font-semibold">
        <ShieldAlert size={18} className="text-brand" />
        <span>{textos[lingua].seg.obrigatorio}</span>
        <Link href={`/${lingua}/perfil#seguranca`} className="underline">{textos[lingua].seg.irConfigurar}</Link>
      </div>
    </div>
  );
}
