/** Tela de criação de conta: valida os dados e cadastra o usuário. */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { api } from '@/services/api';
import {
  normalizarEmail,
  validarConfirmacaoSenha,
  validarEmail,
  validarNome,
  validarSenha,
} from '@/utils/validacao';

type Erros = {
  nome: string | null;
  email: string | null;
  senha: string | null;
  confirmacao: string | null;
};

export default function TelaCadastro() {
  const router = useRouter();
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [senhaVisivel, definirSenhaVisivel] = useState(false);
  const [erros, definirErros] = useState<Erros>({
    nome: null,
    email: null,
    senha: null,
    confirmacao: null,
  });
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(false);

  function limpar(campo: keyof Erros) {
    definirErros((atuais) => ({ ...atuais, [campo]: null }));
    definirErro('');
  }

  async function criarConta() {
    const encontrados: Erros = {
      nome: validarNome(nome),
      email: validarEmail(email),
      senha: validarSenha(senha),
      confirmacao: validarConfirmacaoSenha(senha, confirmacao),
    };
    definirErros(encontrados);
    definirErro('');
    if (Object.values(encontrados).some(Boolean) || carregando) return;

    definirCarregando(true);
    const resultado = await api('/usuarios', 'POST', {
      nome: nome.trim(),
      email: normalizarEmail(email),
      senha,
    });
    definirCarregando(false);

    if (!resultado.ok) {
      definirErro(resultado.erro);
      return;
    }

    router.replace('/login');
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Criar conta</Text>
      <Text>Cadastre seus dados para começar a usar o Conecta+.</Text>

      {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}

      <View>
        <Text>Nome</Text>
        <TextInput
          placeholder="Seu nome completo"
          value={nome}
          onChangeText={(valor) => {
            definirNome(valor);
            limpar('nome');
          }}
          autoCapitalize="words"
          autoComplete="name"
          editable={!carregando}
        />
        {erros.nome ? <Text>{erros.nome}</Text> : null}
      </View>

      <View>
        <Text>E-mail</Text>
        <TextInput
          placeholder="nome@organizacao.com"
          value={email}
          onChangeText={(valor) => {
            definirEmail(valor);
            limpar('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!carregando}
        />
        {erros.email ? <Text>{erros.email}</Text> : null}
      </View>

      <View>
        <Text>Senha</Text>
        <TextInput
          placeholder="Crie uma senha"
          value={senha}
          onChangeText={(valor) => {
            definirSenha(valor);
            limpar('senha');
          }}
          secureTextEntry={!senhaVisivel}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!carregando}
        />
        {erros.senha ? <Text>{erros.senha}</Text> : null}
      </View>

      <View>
        <Text>Confirmar senha</Text>
        <TextInput
          placeholder="Digite a senha novamente"
          value={confirmacao}
          onChangeText={(valor) => {
            definirConfirmacao(valor);
            limpar('confirmacao');
          }}
          secureTextEntry={!senhaVisivel}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!carregando}
          returnKeyType="go"
          onSubmitEditing={criarConta}
        />
        {erros.confirmacao ? <Text>{erros.confirmacao}</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={() => definirSenhaVisivel((v) => !v)}>
        <Text>{senhaVisivel ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={criarConta} disabled={carregando}>
        <Text>{carregando ? 'Criando...' : 'Criar conta'}</Text>
      </Pressable>

      <Text>Já tem uma conta?</Text>
      <Link href="/login">Entrar</Link>
    </ScrollView>
  );
}
