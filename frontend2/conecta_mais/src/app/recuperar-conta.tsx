/** Tela de recuperação de conta: envia o link temporário de redefinição de senha. */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import { normalizarEmail, validarEmail } from '@/utils/validacao';

export default function TelaRecuperarConta() {
  const router = useRouter();
  const [email, definirEmail] = useState('');
  const [erroCampo, definirErroCampo] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState('');
  const [carregando, definirCarregando] = useState(false);

  async function enviar() {
    const encontrado = validarEmail(email);
    definirErroCampo(encontrado);
    definirMensagem('');
    if (encontrado || carregando) return;

    definirCarregando(true);
    const resultado = await api<{ mensagem: string }>('/auth/recuperar-conta', 'POST', {
      email: normalizarEmail(email),
    });
    definirCarregando(false);
    definirMensagem(resultado.ok ? resultado.dados.mensagem : resultado.erro);
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Recuperar conta</Text>
      <Text>
        Informe o e-mail do cadastro. Enviaremos um link válido por 30 minutos para você criar uma
        nova senha.
      </Text>

      {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}

      <View>
        <Text>E-mail</Text>
        <TextInput
          placeholder="nome@organizacao.com"
          value={email}
          onChangeText={(valor) => {
            definirEmail(valor);
            definirErroCampo(null);
            definirMensagem('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!carregando}
          returnKeyType="send"
          onSubmitEditing={enviar}
        />
        {erroCampo ? <Text>{erroCampo}</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={enviar} disabled={carregando}>
        <Text>{carregando ? 'Enviando...' : 'Enviar link'}</Text>
      </Pressable>
    </ScrollView>
  );
}
