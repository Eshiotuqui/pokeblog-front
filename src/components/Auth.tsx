'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { chamar, ErroApi, type Usuario } from '../lib/api.ts';

interface Ctx {
  usuario: Usuario | null;
  carregando: boolean;
  definir: (u: Usuario | null) => void;
  sair: () => Promise<void>;
}
const Contexto = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    chamar<{ usuario: Usuario }>('GET', '/auth/me')
      .then((r) => vivo && setUsuario(r.usuario))
      .catch((e) => { if (!(e instanceof ErroApi && e.status === 401)) console.error(e); })
      .finally(() => vivo && setCarregando(false));
    return () => { vivo = false; };
  }, []);

  const sair = useCallback(async () => {
    await chamar('POST', '/auth/logout').catch(() => {});
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, carregando, definir: setUsuario, sair }), [usuario, carregando, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
