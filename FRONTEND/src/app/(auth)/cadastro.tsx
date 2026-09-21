/**
 * Tela de cadastro de usuário — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica do cadastro.
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { useCadastro } from '@/hooks/useCadastro';

export default function TelaCadastro() {
  const router = useRouter();
  const {
    nome,
    email,
    senha,
    confirmarSenha,
    erros,
    erroGeral,
    carregando,
    definirNome,
    definirEmail,
    definirSenha,
    definirConfirmarSenha,
    submeter,
  } = useCadastro();
  const [senhaVisivel, definirSenhaVisivel] = useState(false);
  const [confirmacaoVisivel, definirConfirmacaoVisivel] = useState(false);

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      <Text>Criar conta</Text>
      <Text>Cadastre seus dados para começar a usar o Conecta+.</Text>

      <View>
        <CampoTexto
          rotulo="Nome"
          placeholder="Seu nome completo"
          value={nome}
          onChangeText={definirNome}
          erro={erros.nome}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        <CampoTexto
          rotulo="E-mail"
          placeholder="nome@organizacao.com"
          value={email}
          onChangeText={definirEmail}
          erro={erros.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <CampoTexto
          rotulo="Senha"
          placeholder="Crie uma senha"
          value={senha}
          onChangeText={definirSenha}
          erro={erros.senha}
          secureTextEntry={!senhaVisivel}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          acaoFinal={{
            rotulo: senhaVisivel ? 'Ocultar senha' : 'Mostrar senha',
            aoTocar: () => definirSenhaVisivel((visivel) => !visivel),
          }}
        />
        <CampoTexto
          rotulo="Confirmar senha"
          placeholder="Digite a senha novamente"
          value={confirmarSenha}
          onChangeText={definirConfirmarSenha}
          erro={erros.confirmarSenha}
          secureTextEntry={!confirmacaoVisivel}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          acaoFinal={{
            rotulo: confirmacaoVisivel ? 'Ocultar confirmação' : 'Mostrar confirmação',
            aoTocar: () => definirConfirmacaoVisivel((visivel) => !visivel),
          }}
        />
      </View>

      {erroGeral ? <Text>{erroGeral}</Text> : null}

      <BotaoPrimario titulo="Criar conta" aoTocar={submeter} carregando={carregando} />

      <Text>Já tem uma conta?</Text>
      <Link href="/login">Entrar</Link>
    </ScrollView>
  );
}
