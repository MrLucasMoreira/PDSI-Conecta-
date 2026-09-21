/**
 * Tela de troca autenticada de senha — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica da alteração.
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import type { Aviso } from '@/hooks/useLogin';
import { alterarSenha } from '@/services/usuarioService';
import { validarConfirmacaoSenha, validarSenha } from '@/utils/validacao';

export default function TelaAlterarSenha() {
  const router = useRouter();
  const [senhaAtual, definirSenhaAtual] = useState('');
  const [novaSenha, definirNovaSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erros, definirErros] = useState({
    atual: null as string | null,
    nova: null as string | null,
    confirmacao: null as string | null,
  });
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  async function salvar() {
    const encontrados = {
      atual: validarSenha(senhaAtual),
      nova: validarSenha(novaSenha),
      confirmacao: validarConfirmacaoSenha(novaSenha, confirmacao),
    };
    definirErros(encontrados);
    if (encontrados.atual || encontrados.nova || encontrados.confirmacao || carregando) return;

    definirCarregando(true);
    const resultado = await alterarSenha({ senhaAtual, novaSenha });
    definirCarregando(false);
    if (!resultado.sucesso) {
      definirAviso({
        tom: 'erro',
        titulo: 'Não foi possível alterar',
        mensagem: resultado.mensagem,
      });
      return;
    }
    definirSenhaAtual('');
    definirNovaSenha('');
    definirConfirmacao('');
    definirAviso({
      tom: 'informacao',
      titulo: 'Senha alterada',
      mensagem: resultado.dados.mensagem,
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      <Text>Alterar senha</Text>
      <Text>Segurança da conta</Text>
      <Text>Confirme sua senha atual antes de escolher uma nova.</Text>

      {aviso ? <AvisoFormulario aviso={aviso} /> : null}

      <View>
        <CampoTexto
          rotulo="Senha atual"
          value={senhaAtual}
          onChangeText={(v) => {
            definirSenhaAtual(v);
            definirErros((e) => ({ ...e, atual: null }));
          }}
          erro={erros.atual}
          secureTextEntry
        />
        <CampoTexto
          rotulo="Nova senha"
          value={novaSenha}
          onChangeText={(v) => {
            definirNovaSenha(v);
            definirErros((e) => ({ ...e, nova: null }));
          }}
          erro={erros.nova}
          secureTextEntry
        />
        <CampoTexto
          rotulo="Confirmar nova senha"
          value={confirmacao}
          onChangeText={(v) => {
            definirConfirmacao(v);
            definirErros((e) => ({ ...e, confirmacao: null }));
          }}
          erro={erros.confirmacao}
          secureTextEntry
        />
      </View>

      <BotaoPrimario
        titulo="Alterar senha"
        tituloCarregando="Salvando..."
        carregando={carregando}
        aoTocar={salvar}
      />
    </ScrollView>
  );
}
