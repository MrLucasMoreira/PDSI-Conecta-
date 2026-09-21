/**
 * Estrutura comum das telas de comissões.
 *
 * Versão sem estilização: mantém o cabeçalho com voltar, o indicador de
 * carregamento, a faixa de erro com "tentar novamente" e o aviso de sucesso.
 */

import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

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
  const router = useRouter();

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/inicio')
          }
        >
          <Text>Voltar</Text>
        </Pressable>
        <Text>{titulo}</Text>
      </View>

      {!!erro && (
        <View>
          <Text accessibilityRole="alert">{erro}</Text>
          {tentarNovamente && (
            <AcaoComissao titulo="Tentar novamente" aoTocar={tentarNovamente} />
          )}
        </View>
      )}

      {!!sucesso && <Text accessibilityLiveRegion="polite">{sucesso}</Text>}

      {carregando ? (
        <Text accessibilityLabel="Carregando comissões">Carregando...</Text>
      ) : (
        children
      )}
    </ScrollView>
  );
}

export function AcaoComissao({
  titulo,
  aoTocar,
  desabilitado = false,
}: {
  titulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  /** Mantido por compatibilidade; sem efeito visual nesta versão. */
  perigo?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
    >
      <Text>{titulo}</Text>
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
  return (
    <Modal
      visible={!!mensagem}
      transparent
      onRequestClose={() => {
        if (!carregando) cancelar();
      }}
    >
      <View accessibilityViewIsModal>
        <Text>Confirmar alteração</Text>
        <Text>{mensagem}</Text>
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
    </Modal>
  );
}
