/**
 * Ação principal das telas.
 *
 * Versão sem estilização: bloqueia novos toques enquanto a ação está em
 * andamento e avisa disso pelo texto e pelo estado de acessibilidade.
 */

import { Pressable, Text } from 'react-native';

type BotaoPrimarioProps = {
  titulo: string;
  aoTocar: () => void;
  /** Bloqueia novos toques e troca o texto pelo de progresso. */
  carregando?: boolean;
  desabilitado?: boolean;
  /** Texto exibido enquanto a ação está em andamento. */
  tituloCarregando?: string;
};

export function BotaoPrimario({
  titulo,
  aoTocar,
  carregando = false,
  desabilitado = false,
  tituloCarregando = 'Entrando...',
}: BotaoPrimarioProps) {
  const bloqueado = desabilitado || carregando;

  return (
    <Pressable
      onPress={aoTocar}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: bloqueado, busy: carregando }}
    >
      <Text>{carregando ? tituloCarregando : titulo}</Text>
    </Pressable>
  );
}
