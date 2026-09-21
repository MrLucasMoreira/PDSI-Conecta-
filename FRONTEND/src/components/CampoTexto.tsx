/**
 * Campo de texto padrão dos formulários.
 *
 * Versão sem estilização: rótulo acima do campo e mensagem de validação logo
 * abaixo, junto do campo que precisa de correção.
 */

import { forwardRef } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type CampoTextoProps = TextInputProps & {
  rotulo: string;
  /** Mensagem de validação; quando presente, aparece abaixo do campo. */
  erro?: string | null;
  /** Botão opcional ao lado do campo, usado para mostrar ou ocultar a senha. */
  acaoFinal?: {
    rotulo: string;
    aoTocar: () => void;
  };
};

export const CampoTexto = forwardRef<TextInput, CampoTextoProps>(function CampoTexto(
  { rotulo, erro = null, acaoFinal, multiline = false, ...props },
  ref,
) {
  return (
    <View>
      <Text>{rotulo}</Text>

      <TextInput
        ref={ref}
        multiline={multiline}
        accessibilityLabel={rotulo}
        accessibilityHint={erro ?? undefined}
        {...props}
      />

      {acaoFinal ? (
        <Pressable
          onPress={acaoFinal.aoTocar}
          accessibilityRole="button"
          accessibilityLabel={acaoFinal.rotulo}
        >
          <Text>{acaoFinal.rotulo}</Text>
        </Pressable>
      ) : null}

      {erro !== null ? <Text>{erro}</Text> : null}
    </View>
  );
});
