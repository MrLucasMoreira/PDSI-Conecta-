/**
 * Campo de texto padrão dos formulários.
 *
 * Segue os padrões para telas descritos em PropostaInicial/objetivos.md: rótulo
 * acima do campo e mensagem de validação logo abaixo, junto do campo que precisa
 * de correção.
 */

import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CORES } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';

type CampoTextoProps = TextInputProps & {
  rotulo: string;
  /** Ícone do Ionicons exibido à esquerda do campo. */
  icone: keyof typeof Ionicons.glyphMap;
  /** Mensagem de validação; quando presente, o campo é destacado como inválido. */
  erro?: string | null;
  /** Botão opcional à direita, usado para mostrar ou ocultar a senha. */
  acaoFinal?: {
    icone: keyof typeof Ionicons.glyphMap;
    rotuloAcessivel: string;
    aoTocar: () => void;
  };
};

/** Altura do campo de uma linha e do campo de texto longo. */
const ALTURA_PADRAO = 56;
const ALTURA_MULTILINHA = 120;
const FOLGA_VERTICAL = 16;

export const CampoTexto = forwardRef<TextInput, CampoTextoProps>(function CampoTexto(
  { rotulo, icone, erro = null, acaoFinal, multiline = false, onFocus, onBlur, ...props },
  ref,
) {
  const [focado, definirFocado] = useState(false);
  const { cores, temaEfetivo } = useTema();

  const invalido = erro !== null;
  const corDaBorda = invalido ? CORES.ERRO : focado ? CORES.AZUL : cores.borda;
  const corDoIcone = invalido ? CORES.ERRO : focado ? CORES.AZUL : cores.textoMedio;

  return (
    <View style={styles.container}>
      <Text style={[styles.rotulo, { color: cores.textoMedio }]}>{rotulo}</Text>

      <View
        style={[styles.campo, {
          backgroundColor: cores.campo,
          borderWidth: 1.5,
          borderColor: corDaBorda,
          height: multiline ? ALTURA_MULTILINHA : ALTURA_PADRAO,
          alignItems: multiline ? 'flex-start' : 'center',
          paddingVertical: multiline ? FOLGA_VERTICAL : 0,
        }]}
      >
        <Ionicons name={icone} size={20} color={corDoIcone} />

        <TextInput
          ref={ref}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.entrada, { color: cores.textoForte }, multiline ? null : styles.entradaUmaLinha]}
          placeholderTextColor={temaEfetivo === 'escuro' ? '#9297b4' : CORES.TEXTO_FRACO}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? undefined}
          onFocus={(evento) => {
            definirFocado(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            definirFocado(false);
            onBlur?.(evento);
          }}
          {...props}
        />

        {acaoFinal ? (
          <Pressable
            onPress={acaoFinal.aoTocar}
            accessibilityRole="button"
            accessibilityLabel={acaoFinal.rotuloAcessivel}
            hitSlop={10}
            style={styles.acaoFinal}
          >
            <Ionicons name={acaoFinal.icone} size={20} color={cores.textoMedio} />
          </Pressable>
        ) : null}
      </View>

      {invalido ? (
        <View style={styles.erroContainer}>
          <Ionicons name="alert-circle" size={14} color={CORES.ERRO} />
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%' },
  rotulo: {
    marginBottom: 8,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: CORES.TEXTO_MEDIO,
  },
  campo: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: CORES.CAMPO,
    paddingHorizontal: 16,
  },
  entrada: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: CORES.TEXTO_FORTE,
  },
  entradaUmaLinha: { height: '100%' },
  acaoFinal: { paddingLeft: 8 },
  erroContainer: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  erroTexto: {
    flex: 1,
    marginLeft: 6,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: CORES.ERRO,
  },
});
