/**
 * Tela de criação de nova senha pelo link recebido por e-mail — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica da redefinição.
 */

import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import type { Aviso } from '@/hooks/useLogin';
import { redefinirSenha } from '@/services/authService';
import { validarConfirmacaoSenha, validarSenha } from '@/utils/validacao';

export default function TelaRedefinirSenha() {
  const router = useRouter();
  const { token = '' } = useLocalSearchParams<{ token?: string }>();
  const [senha, definirSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erros, definirErros] = useState({
    senha: null as string | null,
    confirmacao: null as string | null,
  });
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  async function submeter() {
    const encontrados = {
      senha: validarSenha(senha),
      confirmacao: validarConfirmacaoSenha(senha, confirmacao),
    };
    definirErros(encontrados);
    if (encontrados.senha || encontrados.confirmacao || carregando) return;
    if (!token) {
      definirAviso({
        tom: 'erro',
        titulo: 'Link inválido',
        mensagem: 'Abra novamente o link recebido por e-mail.',
      });
      return;
    }

    definirCarregando(true);
    const resultado = await redefinirSenha(token, senha);
    definirCarregando(false);
    definirAviso(
      resultado.sucesso
        ? {
            tom: 'informacao',
            titulo: 'Senha redefinida',
            mensagem: 'Você já pode entrar com a nova senha.',
          }
        : {
            tom: 'erro',
            titulo: 'Não foi possível redefinir',
            mensagem: resultado.mensagem,
          },
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar ao login" aoTocar={() => router.replace('/login')} />

      <Text>Criar nova senha</Text>
      <Text>Escolha uma nova senha para acessar o Conecta+.</Text>

      {aviso ? <AvisoFormulario aviso={aviso} /> : null}

      <CampoTexto
        rotulo="Nova senha"
        placeholder="Nova senha"
        value={senha}
        onChangeText={(v) => {
          definirSenha(v);
          definirErros((e) => ({ ...e, senha: null }));
        }}
        erro={erros.senha}
        secureTextEntry
      />
      <CampoTexto
        rotulo="Confirmar nova senha"
        placeholder="Digite novamente"
        value={confirmacao}
        onChangeText={(v) => {
          definirConfirmacao(v);
          definirErros((e) => ({ ...e, confirmacao: null }));
        }}
        erro={erros.confirmacao}
        secureTextEntry
      />

      <BotaoPrimario
        titulo="Redefinir senha"
        tituloCarregando="Salvando..."
        carregando={carregando}
        aoTocar={submeter}
      />

      {aviso?.tom === 'informacao' ? (
        <BotaoPrimario titulo="Voltar para o login" aoTocar={() => router.replace('/login')} />
      ) : null}
    </ScrollView>
  );
}
