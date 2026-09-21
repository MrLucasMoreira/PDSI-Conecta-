/** Tela do administrador do sistema: autoriza, revoga e edita as organizações. */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api, type Organizacao } from '@/services/api';
import {
  TAMANHO_MAXIMO_DESCRICAO,
  validarDescricao,
  validarNomeOrganizacao,
} from '@/utils/validacao';

export default function TelaGerenciarOrganizacoes() {
  const router = useRouter();
  const [organizacoes, definirOrganizacoes] = useState<Organizacao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [salvandoId, definirSalvandoId] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState('');
  const [editandoId, definirEditandoId] = useState<string | null>(null);
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');

  const erroNome = validarNomeOrganizacao(nome);
  const erroDescricao = validarDescricao(descricao);

  useEffect(() => {
    let ativa = true;

    void api<Organizacao[]>('/organizacoes').then((resultado) => {
      if (!ativa) return;
      definirCarregando(false);
      if (resultado.ok) definirOrganizacoes(resultado.dados);
      else definirMensagem(resultado.erro);
    });

    return () => {
      ativa = false;
    };
  }, []);

  async function atualizar(id: string, dados: Partial<Organizacao>) {
    definirSalvandoId(id);
    definirMensagem('');
    const resultado = await api<Organizacao>(`/organizacoes/${id}`, 'PATCH', dados);
    definirSalvandoId(null);

    if (!resultado.ok) {
      definirMensagem(resultado.erro);
      return false;
    }

    definirOrganizacoes((lista) =>
      lista.map((item) => (item._id === id ? resultado.dados : item)),
    );
    return true;
  }

  async function salvarEdicao(id: string) {
    if (erroNome || erroDescricao) return;
    if (await atualizar(id, { nome: nome.trim(), descricao: descricao.trim() })) {
      definirEditandoId(null);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Gerenciar organizações</Text>

      {carregando ? <Text>Carregando...</Text> : null}
      {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}
      {!carregando && organizacoes.length === 0 ? <Text>Nenhuma organização cadastrada.</Text> : null}

      {organizacoes.map((organizacao) => {
        const salvando = salvandoId === organizacao._id;

        if (editandoId === organizacao._id) {
          return (
            <View key={organizacao._id}>
              <Text>Nome</Text>
              <TextInput value={nome} onChangeText={definirNome} editable={!salvando} />
              {erroNome ? <Text>{erroNome}</Text> : null}

              <Text>Descrição</Text>
              <TextInput
                value={descricao}
                onChangeText={definirDescricao}
                multiline
                maxLength={TAMANHO_MAXIMO_DESCRICAO}
                editable={!salvando}
              />
              {erroDescricao ? <Text>{erroDescricao}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={salvando || !!erroNome || !!erroDescricao}
                onPress={() => salvarEdicao(organizacao._id)}
              >
                <Text>{salvando ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={salvando}
                onPress={() => definirEditandoId(null)}
              >
                <Text>Cancelar</Text>
              </Pressable>
            </View>
          );
        }

        return (
          <View key={organizacao._id}>
            <Text>{organizacao.nome}</Text>
            {organizacao.descricao ? <Text>{organizacao.descricao}</Text> : null}
            <Text>Criada por: {organizacao.criadaPor?.nome ?? '-'}</Text>
            <Text>Situação: {organizacao.status}</Text>

            {organizacao.status !== 'APROVADA' ? (
              <Pressable
                accessibilityRole="button"
                disabled={salvando}
                onPress={() => atualizar(organizacao._id, { status: 'APROVADA' })}
              >
                <Text>Autorizar</Text>
              </Pressable>
            ) : null}

            {organizacao.status !== 'REVOGADA' ? (
              <Pressable
                accessibilityRole="button"
                disabled={salvando}
                onPress={() => atualizar(organizacao._id, { status: 'REVOGADA' })}
              >
                <Text>Revogar</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={salvando}
              onPress={() => {
                definirEditandoId(organizacao._id);
                definirNome(organizacao.nome);
                definirDescricao(organizacao.descricao ?? '');
              }}
            >
              <Text>Editar</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
