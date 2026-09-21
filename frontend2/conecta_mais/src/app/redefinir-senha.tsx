/** Tela de nova senha a partir do link recebido por e-mail. */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '@/services/api';
import { validarConfirmacaoSenha, validarSenha } from '@/utils/validacao';

export default function TelaRedefinirSenha() {
  const router = useRouter();
  const { token = '' } = useLocalSearchParams<{ token?: string }>();
  const [senha, definirSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erros, definirErros] = useState<{ senha: string | null; confirmacao: string | null }>({
    senha: null,
    confirmacao: null,
  });
  const [mensagem, definirMensagem] = useState('');
  const [redefinida, definirRedefinida] = useState(false);
  const [carregando, definirCarregando] = useState(false);

  async function redefinir() {
    const encontrados = {
      senha: validarSenha(senha),
      confirmacao: validarConfirmacaoSenha(senha, confirmacao),
    };
    definirErros(encontrados);
    definirMensagem('');
    if (encontrados.senha || encontrados.confirmacao || carregando) return;

    definirCarregando(true);
    const resultado = await api('/auth/redefinir-senha', 'POST', { token, novaSenha: senha });
    definirCarregando(false);
    definirRedefinida(resultado.ok);
    definirMensagem(
      resultado.ok ? 'Senha redefinida. Você já pode entrar com a nova senha.' : resultado.erro,
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Text>Criar nova senha</Text>
      <Text>Escolha uma nova senha para acessar o Conecta+.</Text>

      {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}

      <View>
        <Text>Nova senha</Text>
        <TextInput
          value={senha}
          onChangeText={(valor) => {
            definirSenha(valor);
            definirErros((atuais) => ({ ...atuais, senha: null }));
          }}
          secureTextEntry
          autoCapitalize="none"
          editable={!carregando && !redefinida}
        />
        {erros.senha ? <Text>{erros.senha}</Text> : null}
      </View>

      <View>
        <Text>Confirmar nova senha</Text>
        <TextInput
          value={confirmacao}
          onChangeText={(valor) => {
            definirConfirmacao(valor);
            definirErros((atuais) => ({ ...atuais, confirmacao: null }));
          }}
          secureTextEntry
          autoCapitalize="none"
          editable={!carregando && !redefinida}
          returnKeyType="go"
          onSubmitEditing={redefinir}
        />
        {erros.confirmacao ? <Text>{erros.confirmacao}</Text> : null}
      </View>

      {!redefinida ? (
        <Pressable accessibilityRole="button" onPress={redefinir} disabled={carregando}>
          <Text>{carregando ? 'Salvando...' : 'Redefinir senha'}</Text>
        </Pressable>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.replace('/login')}>
        <Text>Voltar para o login</Text>
      </Pressable>
    </ScrollView>
  );
}
