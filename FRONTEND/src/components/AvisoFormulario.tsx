/**
 * Faixa de aviso do formulário.
 *
 * Versão sem estilização: comunica tanto falhas de autenticação quanto a
 * situação do cadastro do usuário perante a organização (aguardando aprovação,
 * recusado ou ainda sem organização vinculada).
 */

import { Text, View } from 'react-native';

import type { Aviso } from '@/hooks/useLogin';

type AvisoFormularioProps = {
  aviso: Aviso;
};

export function AvisoFormulario({ aviso }: AvisoFormularioProps) {
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${aviso.titulo}. ${aviso.mensagem}`}
    >
      <Text>{aviso.titulo}</Text>
      <Text>{aviso.mensagem}</Text>
    </View>
  );
}
