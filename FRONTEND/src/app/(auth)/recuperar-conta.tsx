/**
 * Tela de recuperação de conta — Incremento 1.
 *
 * Versão sem estilização: solicita o link temporário de redefinição de senha.
 */

import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import type { Aviso } from '@/hooks/useLogin';
import { solicitarRecuperacao } from '@/services/authService';
import { normalizarEmail, validarEmail } from '@/utils/validacao';

export default function TelaRecuperarConta() {
  const router = useRouter();
  const [email, definirEmail] = useState('');
  const [erro, definirErro] = useState<string | null>(null);
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  async function submeter() {
    const erroEmail = validarEmail(email);
    definirErro(erroEmail);
    if (erroEmail || carregando) return;

    definirCarregando(true);
    const resultado = await solicitarRecuperacao(normalizarEmail(email));
    definirCarregando(false);
    definirAviso({
      tom: resultado.sucesso ? 'informacao' : 'erro',
      titulo: resultado.sucesso ? 'Confira seu e-mail' : 'Não foi possível enviar',
      mensagem: resultado.mensagem,
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      <Text>Recuperar conta</Text>
      <Text>
        Informe o e-mail do cadastro. Enviaremos um link válido por 30 minutos para você criar
        uma nova senha.
      </Text>

      {aviso ? <AvisoFormulario aviso={aviso} /> : null}

      <CampoTexto
        rotulo="E-mail"
        placeholder="nome@organizacao.com"
        value={email}
        onChangeText={(valor) => {
          definirEmail(valor);
          definirErro(null);
          definirAviso(null);
        }}
        erro={erro}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!carregando}
        returnKeyType="send"
        onSubmitEditing={submeter}
      />

      <BotaoPrimario
        titulo="Enviar link"
        tituloCarregando="Enviando..."
        carregando={carregando}
        aoTocar={submeter}
      />
    </ScrollView>
  );
}
