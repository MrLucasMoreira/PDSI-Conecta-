import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { CORES } from '@/constants/theme';
import { TEMAS, type TemaUsuario } from '@/models/usuario';
import { obterTemaLocal, salvarTemaLocal } from '@/services/sessaoService';

const PALETAS = {
  claro: {
    fundo: CORES.FUNDO,
    cartao: CORES.CARTAO,
    campo: CORES.CAMPO,
    textoForte: CORES.TEXTO_FORTE,
    textoMedio: CORES.TEXTO_MEDIO,
    borda: CORES.BORDA,
  },
  escuro: {
    fundo: '#101225',
    cartao: '#191c36',
    campo: '#242846',
    textoForte: '#f7f7ff',
    textoMedio: '#c5c8dd',
    borda: '#343955',
  },
} as const;

type TemaContexto = {
  temaPreferido: TemaUsuario;
  temaEfetivo: 'claro' | 'escuro';
  cores: (typeof PALETAS)['claro'] | (typeof PALETAS)['escuro'];
  definirTemaPreferido: (tema: TemaUsuario) => Promise<void>;
};

const TemaContext = createContext<TemaContexto | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const esquemaSistema = useColorScheme();
  const [temaPreferido, definirTema] = useState<TemaUsuario>(TEMAS.SISTEMA);

  useEffect(() => {
    void obterTemaLocal().then((tema) => {
      if (tema === TEMAS.CLARO || tema === TEMAS.ESCURO || tema === TEMAS.SISTEMA) {
        definirTema(tema);
      }
    });
  }, []);

  const temaEfetivo =
    temaPreferido === TEMAS.SISTEMA
      ? esquemaSistema === 'dark'
        ? TEMAS.ESCURO
        : TEMAS.CLARO
      : temaPreferido;

  const definirTemaPreferido = useCallback(async (tema: TemaUsuario) => {
    definirTema(tema);
    await salvarTemaLocal(tema);
  }, []);

  const valor = useMemo<TemaContexto>(
    () => ({
      temaPreferido,
      temaEfetivo,
      cores: PALETAS[temaEfetivo],
      definirTemaPreferido,
    }),
    [definirTemaPreferido, temaEfetivo, temaPreferido],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const contexto = useContext(TemaContext);

  if (!contexto) {
    throw new Error('useTema precisa ser usado dentro de TemaProvider');
  }

  return contexto;
}
