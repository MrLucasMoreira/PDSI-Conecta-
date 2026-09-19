/**
 * Faixa de aviso do formulário.
 *
 * Comunica tanto falhas de autenticação quanto a situação do cadastro do
 * usuário perante a organização (aguardando aprovação, recusado ou ainda sem
 * organização vinculada).
 */

import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CORES } from '@/constants/theme';
import type { Aviso } from '@/hooks/useLogin';

type AvisoFormularioProps = {
  aviso: Aviso;
};

const APARENCIA = {
  erro: {
    icone: 'close-circle' as const,
    cor: CORES.ERRO,
    fundo: '#fdeef0',
    borda: '#f6c9d0',
  },
  alerta: {
    icone: 'time' as const,
    cor: CORES.ALERTA,
    fundo: '#fdf3e6',
    borda: '#f2ddbc',
  },
  informacao: {
    icone: 'information-circle' as const,
    cor: CORES.AZUL,
    fundo: '#eaf1fe',
    borda: '#cbdcfb',
  },
};

export function AvisoFormulario({ aviso }: AvisoFormularioProps) {
  const aparencia = APARENCIA[aviso.tom];

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${aviso.titulo}. ${aviso.mensagem}`}
      style={[styles.container, { backgroundColor: aparencia.fundo, borderColor: aparencia.borda }]}
    >
      <Ionicons name={aparencia.icone} size={20} color={aparencia.cor} />

      <View style={styles.conteudo}>
        <Text style={[styles.titulo, { color: aparencia.cor }]}>
          {aviso.titulo}
        </Text>
        <Text style={styles.mensagem}>
          {aviso.mensagem}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  conteudo: { flex: 1, marginLeft: 12 },
  titulo: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  mensagem: {
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: CORES.TEXTO_MEDIO,
  },
});
