/** Tela de login: valida as credenciais, guarda o token e abre o início. */

import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { api, salvarToken } from '@/services/api';
import { normalizarEmail, validarEmail, validarSenha } from '@/utils/validacao';

type RespostaLogin = {
  accessToken?: string;
  token?: string;
  usuario: { nome: string; tipo?: string; organizacao?: string | null };
};

export default function TelaLogin() {
  const router = useRouter();
  const campoSenha = useRef<TextInput>(null);
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [senhaVisivel, definirSenhaVisivel] = useState(false);
  const [erros, definirErros] = useState<{ email: string | null; senha: string | null }>({
    email: null,
    senha: null,
  });
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(false);

  async function entrar() {
    const encontrados = { email: validarEmail(email), senha: validarSenha(senha) };
    definirErros(encontrados);
    definirErro('');
    if (encontrados.email || encontrados.senha || carregando) return;

    definirCarregando(true);
    const resultado = await api<RespostaLogin>('/auth/login', 'POST', {
      email: normalizarEmail(email),
      senha,
    });
    definirCarregando(false);

    if (!resultado.ok) {
      definirErro(resultado.erro);
      return;
    }

    const { accessToken, token, usuario } = resultado.dados;
    await salvarToken(accessToken ?? token ?? '');
    router.replace({
      pathname: '/inicio',
      params: {
        nome: usuario.nome,
        tipo: usuario.tipo ?? 'USUARIO',
        organizacao: usuario.organizacao ?? '',
      },
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Text>Entrar</Text>

      {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}

      <View>
        <Text>E-mail</Text>
        <TextInput
          placeholder="nome@organizacao.com"
          value={email}
          onChangeText={(valor) => {
            definirEmail(valor);
            definirErros((atuais) => ({ ...atuais, email: null }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="next"
          editable={!carregando}
          onSubmitEditing={() => campoSenha.current?.focus()}
        />
        {erros.email ? <Text>{erros.email}</Text> : null}
      </View>

      <View>
        <Text>Senha</Text>
        <TextInput
          ref={campoSenha}
          placeholder="Sua senha"
          value={senha}
          onChangeText={(valor) => {
            definirSenha(valor);
            definirErros((atuais) => ({ ...atuais, senha: null }));
          }}
          secureTextEntry={!senhaVisivel}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          returnKeyType="go"
          editable={!carregando}
          onSubmitEditing={entrar}
        />
        <Pressable accessibilityRole="button" onPress={() => definirSenhaVisivel((v) => !v)}>
          <Text>{senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}</Text>
        </Pressable>
        {erros.senha ? <Text>{erros.senha}</Text> : null}
      </View>

      <Link href="/recuperar-conta">Esqueci minha senha</Link>

      <Pressable accessibilityRole="button" onPress={entrar} disabled={carregando}>
        <Text>{carregando ? 'Entrando...' : 'Entrar'}</Text>
      </Pressable>

      <Text>Ainda não tem conta?</Text>
      <Link href="/cadastro">Criar conta</Link>
    </ScrollView>
  );
}
