/**
 * Tela de dados pessoais — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica de carregar e salvar o perfil.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import type { Aviso } from '@/hooks/useLogin';
import { atualizarPerfil, obterPerfil } from '@/services/usuarioService';
import { normalizarEmail, validarEmail, validarNome } from '@/utils/validacao';

export default function TelaPerfil() {
  const router = useRouter();
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [erros, definirErros] = useState({
    nome: null as string | null,
    email: null as string | null,
  });

  useEffect(() => {
    void obterPerfil().then((resultado) => {
      definirCarregando(false);
      if (!resultado.sucesso) {
        definirAviso({
          tom: 'erro',
          titulo: 'Não foi possível carregar',
          mensagem: resultado.mensagem,
        });
        return;
      }
      definirNome(resultado.dados.nome);
      definirEmail(resultado.dados.email);
    });
  }, []);

  async function salvar() {
    const encontrados = { nome: validarNome(nome), email: validarEmail(email) };
    definirErros(encontrados);
    if (encontrados.nome || encontrados.email || salvando) return;

    definirSalvando(true);
    const resultado = await atualizarPerfil({ nome: nome.trim(), email: normalizarEmail(email) });
    definirSalvando(false);

    if (!resultado.sucesso) {
      definirAviso({
        tom: 'erro',
        titulo: 'Não foi possível salvar',
        mensagem: resultado.mensagem,
      });
      return;
    }

    definirAviso({
      tom: 'informacao',
      titulo: 'Perfil atualizado',
      mensagem: 'Seus dados foram salvos.',
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      <Text>Perfil</Text>

      {carregando ? (
        <Text accessibilityLabel="Carregando perfil">Carregando...</Text>
      ) : (
        <View>
          <Text>Dados pessoais</Text>
          <Text>Atualize as informações usadas na sua conta.</Text>

          {aviso ? <AvisoFormulario aviso={aviso} /> : null}

          <CampoTexto
            rotulo="Nome"
            value={nome}
            onChangeText={(v) => {
              definirNome(v);
              definirErros((e) => ({ ...e, nome: null }));
            }}
            erro={erros.nome}
            autoCapitalize="words"
          />
          <CampoTexto
            rotulo="E-mail"
            value={email}
            onChangeText={(v) => {
              definirEmail(v);
              definirErros((e) => ({ ...e, email: null }));
            }}
            erro={erros.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <BotaoPrimario
            titulo="Salvar alterações"
            tituloCarregando="Salvando..."
            carregando={salvando}
            aoTocar={salvar}
          />

          <BotaoPrimario
            titulo="Alterar minha senha"
            aoTocar={() => router.push('/alterar-senha')}
          />
        </View>
      )}
    </ScrollView>
  );
}
