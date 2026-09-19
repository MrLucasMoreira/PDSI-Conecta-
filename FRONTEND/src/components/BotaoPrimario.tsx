/**
 * Ação principal das telas, com o gradiente da marca.
 *
 * Mantém posição e feedback previsíveis, conforme os padrões para telas
 * descritos em PropostaInicial/objetivos.md.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CORES, GRADIENTE_MARCA } from '@/constants/theme';

type BotaoPrimarioProps = {
  titulo: string;
  aoTocar: () => void;
  /** Exibe o indicador de progresso e bloqueia novos toques. */
  carregando?: boolean;
  desabilitado?: boolean;
  /** Texto exibido ao lado do indicador de progresso. */
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
      style={({ pressed }) => [
        styles.botao,
        { opacity: bloqueado ? 0.55 : pressed ? 0.9 : 1 },
      ]}
    >
      <LinearGradient
        colors={[...GRADIENTE_MARCA]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradiente}
      >
        {carregando ? (
          <View style={styles.conteudoCarregando}>
            <ActivityIndicator color={CORES.BRANCO} />
            <Text style={[styles.texto, styles.textoCarregando]}>{tituloCarregando}</Text>
          </View>
        ) : (
          <Text style={styles.texto}>{titulo}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: { width: '100%', overflow: 'hidden', borderRadius: 16 },
  gradiente: { height: 56, alignItems: 'center', justifyContent: 'center' },
  conteudoCarregando: { flexDirection: 'row', alignItems: 'center' },
  texto: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: CORES.BRANCO },
  textoCarregando: { marginLeft: 12 },
});
