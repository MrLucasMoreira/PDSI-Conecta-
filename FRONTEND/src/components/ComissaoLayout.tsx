import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '@/contexts/TemaContext';
import { CORES } from '@/constants/theme';
import { BotaoPrimario } from './BotaoPrimario';

export function ComissaoLayout({
  titulo,
  children,
  carregando,
  erro,
  sucesso,
  tentarNovamente,
}: {
  titulo: string;
  children?: ReactNode;
  carregando?: boolean;
  erro?: string;
  sucesso?: string;
  tentarNovamente?: () => void;
}) {
  const { cores } = useTema();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={estilosComissao.pagina}
        >
          <View style={estilosComissao.cabecalho}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={estilosComissao.voltar}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/inicio')
              }
            >
              <Ionicons name="arrow-back" size={24} color={cores.textoForte} />
            </Pressable>
            <Text style={[estilosComissao.titulo, { color: cores.textoForte }]}>
              {titulo}
            </Text>
          </View>
          {!!erro && (
            <View style={estilosComissao.aviso}>
              <Text accessibilityRole="alert" style={{ color: CORES.ERRO }}>
                {erro}
              </Text>
              {tentarNovamente && (
                <AcaoComissao
                  titulo="Tentar novamente"
                  aoTocar={tentarNovamente}
                />
              )}
            </View>
          )}
          {!!sucesso && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: cores.textoForte }}
            >
              {sucesso}
            </Text>
          )}
          {carregando ? (
            <ActivityIndicator
              size="large"
              color={CORES.AZUL}
              accessibilityLabel="Carregando comissões"
            />
          ) : (
            children
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AcaoComissao({
  titulo,
  aoTocar,
  desabilitado = false,
  perigo = false,
}: {
  titulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  perigo?: boolean;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilosComissao.acao,
        {
          borderColor: cores.borda,
          opacity: desabilitado ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: perigo ? CORES.ERRO : cores.textoForte,
          fontFamily: 'Poppins_500Medium',
        }}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

export function ConfirmacaoComissao({
  mensagem,
  confirmar,
  cancelar,
  carregando,
}: {
  mensagem?: string;
  confirmar: () => void;
  cancelar: () => void;
  carregando: boolean;
}) {
  const { cores } = useTema();
  return (
    <Modal
      visible={!!mensagem}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!carregando) cancelar();
      }}
    >
      <View style={estilosComissao.sobreposicao}>
        <View
          accessibilityViewIsModal
          style={[estilosComissao.dialogo, { backgroundColor: cores.cartao }]}
        >
          <Text
            style={[estilosComissao.subtitulo, { color: cores.textoForte }]}
          >
            Confirmar alteração
          </Text>
          <Text style={{ color: cores.textoMedio }}>{mensagem}</Text>
          <BotaoPrimario
            titulo="Confirmar"
            aoTocar={confirmar}
            carregando={carregando}
            tituloCarregando="Salvando..."
          />
          <AcaoComissao
            titulo="Cancelar"
            aoTocar={cancelar}
            desabilitado={carregando}
          />
        </View>
      </View>
    </Modal>
  );
}

export const estilosComissao = StyleSheet.create({
  pagina: {
    flexGrow: 1,
    padding: 24,
    gap: 20,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingBottom: 48,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voltar: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  titulo: { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 25 },
  subtitulo: { fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
  cartao: { borderRadius: 20, padding: 20, gap: 12 },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  acao: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  aviso: { gap: 12 },
  sobreposicao: {
    flex: 1,
    backgroundColor: '#00000088',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogo: {
    padding: 24,
    gap: 20,
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
  },
});
