/**
 * Tela de Login do Conecta+ — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica do requisito de login
 * (validação dos campos, autenticação, situação da solicitação de acesso à
 * organização e navegação para cadastro e recuperação de conta).
 * A identidade visual será reaplicada depois.
 */

import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';

import { useLogin } from '@/hooks/useLogin';

export default function TelaLogin() {
  const campoSenha = useRef<TextInput>(null);

  const {
    email,
    senha,
    senhaVisivel,
    erros,
    aviso,
    carregando,
    aoDigitarEmail,
    aoDigitarSenha,
    alternarVisibilidadeDaSenha,
    submeter,
  } = useLogin();

  return (
    <View>
      <Text>Entrar</Text>

      {aviso ? (
        <View
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${aviso.titulo}. ${aviso.mensagem}`}
        >
          <Text>{aviso.titulo}</Text>
          <Text>{aviso.mensagem}</Text>
        </View>
      ) : null}

      <Text>E-mail</Text>
      <TextInput
        placeholder="nome@organizacao.com"
        value={email}
        onChangeText={aoDigitarEmail}
        accessibilityLabel="E-mail"
        accessibilityHint={erros.email ?? undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        editable={!carregando}
        onSubmitEditing={() => campoSenha.current?.focus()}
      />
      {erros.email ? <Text>{erros.email}</Text> : null}

      <Text>Senha</Text>
      <TextInput
        ref={campoSenha}
        placeholder="Sua senha"
        value={senha}
        onChangeText={aoDigitarSenha}
        accessibilityLabel="Senha"
        accessibilityHint={erros.senha ?? undefined}
        secureTextEntry={!senhaVisivel}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        editable={!carregando}
        onSubmitEditing={submeter}
      />
      <Pressable
        onPress={alternarVisibilidadeDaSenha}
        accessibilityRole="button"
        accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
      >
        <Text>{senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}</Text>
      </Pressable>
      {erros.senha ? <Text>{erros.senha}</Text> : null}

      <Link href="/recuperar-conta">Esqueci minha senha</Link>

      <Pressable
        onPress={submeter}
        disabled={carregando}
        accessibilityRole="button"
        accessibilityLabel="Entrar"
        accessibilityState={{ disabled: carregando, busy: carregando }}
      >
        <Text>{carregando ? 'Entrando...' : 'Entrar'}</Text>
      </Pressable>

      <Text>Ainda não tem conta?</Text>
      <Link href="/cadastro">Criar conta</Link>
    </View>
  );
}
