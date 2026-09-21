/** Tela de troca de senha com a conta já autenticada. */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import { validarConfirmacaoSenha, validarSenha } from '@/utils/validacao';

type Erros = { atual: string | null; nova: string | null; confirmacao: string | null };

export default function TelaAlterarSenha() {
  const router = useRouter();
  const [senhaAtual, definirSenhaAtual] = useState('');
  const [novaSenha, definirNovaSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erros, definirErros] = useState<Erros>({
    atual: null,
    nova: null,
    confirmacao: null,
  });
  const [mensagem, definirMensagem] = useState('');
  const [carregando, definirCarregando] = useState(false);

  function limpar(campo: keyof Erros) {
    definirErros((atuais) => ({ ...atuais, [campo]: null }));
    definirMensagem('');
  }

  async function salvar() {
    const encontrados: Erros = {
      atual: validarSenha(senhaAtual),
      nova: validarSenha(novaSenha),
      confirmacao: validarConfirmacaoSenha(novaSenha, confirmacao),
    };
    definirErros(encontrados);
    definirMensagem('');
    if (Object.values(encontrados).some(Boolean) || carregando) return;

    definirCarregando(true);
    const resultado = await api('/usuarios/me/senha', 'PATCH', { senhaAtual, novaSenha });
    definirCarregando(false);

    if (!resultado.ok) {
      definirMensagem(resultado.erro);
      return;
    }

    definirSenhaAtual('');
    definirNovaSenha('');
    definirConfirmacao('');
    definirMensagem('Senha alterada.');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Alterar senha</Text>
      <Text>Confirme sua senha atual antes de escolher uma nova.</Text>

      {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}

      <View>
        <Text>Senha atual</Text>
        <TextInput
          value={senhaAtual}
          onChangeText={(valor) => {
            definirSenhaAtual(valor);
            limpar('atual');
          }}
          secureTextEntry
          autoCapitalize="none"
          editable={!carregando}
        />
        {erros.atual ? <Text>{erros.atual}</Text> : null}
      </View>

      <View>
        <Text>Nova senha</Text>
        <TextInput
          value={novaSenha}
          onChangeText={(valor) => {
            definirNovaSenha(valor);
            limpar('nova');
          }}
          secureTextEntry
          autoCapitalize="none"
          editable={!carregando}
        />
        {erros.nova ? <Text>{erros.nova}</Text> : null}
      </View>

      <View>
        <Text>Confirmar nova senha</Text>
        <TextInput
          value={confirmacao}
          onChangeText={(valor) => {
            definirConfirmacao(valor);
            limpar('confirmacao');
          }}
          secureTextEntry
          autoCapitalize="none"
          editable={!carregando}
          returnKeyType="go"
          onSubmitEditing={salvar}
        />
        {erros.confirmacao ? <Text>{erros.confirmacao}</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={salvar} disabled={carregando}>
        <Text>{carregando ? 'Salvando...' : 'Alterar senha'}</Text>
      </Pressable>
    </ScrollView>
  );
}
