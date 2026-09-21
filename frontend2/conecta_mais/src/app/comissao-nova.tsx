/** Cadastro de uma nova comissão dentro de uma organização administrada. */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api, type Comissao } from '@/services/api';
import { TAMANHO_MAXIMO_DESCRICAO } from '@/utils/validacao';

export default function TelaNovaComissao() {
  const router = useRouter();
  const [organizacoes, definirOrganizacoes] = useState<{ _id: string; nome: string }[]>([]);
  const [organizacaoId, definirOrganizacaoId] = useState('');
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [erroNome, definirErroNome] = useState<string | null>(null);
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);

  useEffect(() => {
    let ativa = true;

    void api<{ _id: string; nome: string }[]>('/comissoes/organizacoes').then((resultado) => {
      if (!ativa) return;
      definirCarregando(false);
      if (!resultado.ok) {
        definirErro(resultado.erro);
        return;
      }
      definirOrganizacoes(resultado.dados);
      definirOrganizacaoId(resultado.dados[0]?._id ?? '');
    });

    return () => {
      ativa = false;
    };
  }, []);

  async function salvar() {
    if (nome.trim().length < 2) {
      definirErroNome('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    definirErroNome(null);
    if (salvando) return;

    definirSalvando(true);
    definirErro('');
    const resultado = await api<Comissao>('/comissoes', 'POST', {
      nome: nome.trim(),
      descricao: descricao.trim(),
      organizacaoId,
    });
    definirSalvando(false);

    if (!resultado.ok) {
      definirErro(resultado.erro);
      return;
    }

    router.replace({
      pathname: '/comissao',
      params: { id: resultado.dados._id, criada: '1' },
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Nova comissão</Text>

      {carregando ? <Text>Carregando...</Text> : null}
      {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}

      {!carregando && organizacoes.length === 0 ? (
        <Text>
          Nenhuma organização disponível. É necessário ser administrador aprovado de uma
          organização autorizada.
        </Text>
      ) : null}

      {!carregando && organizacoes.length > 0 ? (
        <View>
          <Text>
            Selecione a organização e informe os dados da comissão. Depois de salvar, você poderá
            montar a equipe.
          </Text>

          <Text>Organização *</Text>
          {organizacoes.map((org) => (
            <Pressable
              key={org._id}
              accessibilityRole="button"
              disabled={salvando}
              onPress={() => definirOrganizacaoId(org._id)}
            >
              <Text>
                {org._id === organizacaoId ? '✓ ' : ''}
                {org.nome}
              </Text>
            </Pressable>
          ))}

          <Text>Nome da comissão *</Text>
          <TextInput
            placeholder="Ex.: Comissão de eventos"
            value={nome}
            onChangeText={(valor) => {
              definirNome(valor);
              definirErroNome(null);
            }}
            maxLength={100}
            editable={!salvando}
          />
          {erroNome ? <Text>{erroNome}</Text> : null}

          <Text>Descrição (opcional)</Text>
          <TextInput
            placeholder="Descreva o objetivo da comissão"
            value={descricao}
            onChangeText={definirDescricao}
            maxLength={TAMANHO_MAXIMO_DESCRICAO}
            multiline
            editable={!salvando}
          />

          <Pressable accessibilityRole="button" onPress={salvar} disabled={salvando}>
            <Text>{salvando ? 'Salvando...' : 'Cadastrar comissão'}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
