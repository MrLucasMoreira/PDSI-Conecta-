/** Lista das comissões das organizações administradas, com busca e filtro por situação. */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { api, type Comissao } from '@/services/api';

const FILTROS = ['Todas', 'Ativas', 'Inativas'] as const;

export default function TelaComissoes() {
  const router = useRouter();
  const [comissoes, definirComissoes] = useState<Comissao[]>([]);
  const [organizacoes, definirOrganizacoes] = useState<{ _id: string; nome: string }[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [busca, definirBusca] = useState('');
  const [filtro, definirFiltro] = useState<(typeof FILTROS)[number]>('Todas');

  useFocusEffect(
    useCallback(() => {
      let ativa = true;
      definirCarregando(true);
      definirErro('');

      void Promise.all([
        api<Comissao[]>('/comissoes'),
        api<{ _id: string; nome: string }[]>('/comissoes/organizacoes'),
      ]).then(([lista, orgs]) => {
        if (!ativa) return;
        definirCarregando(false);
        if (!lista.ok) {
          definirErro(lista.erro);
          return;
        }
        if (!orgs.ok) {
          definirErro(orgs.erro);
          return;
        }
        definirComissoes(lista.dados);
        definirOrganizacoes(orgs.dados);
      });

      return () => {
        ativa = false;
      };
    }, []),
  );

  const termo = busca.trim().toLocaleLowerCase();
  const lista = comissoes.filter(
    (comissao) =>
      `${comissao.nome} ${comissao.organizacaoId.nome}`.toLocaleLowerCase().includes(termo) &&
      (filtro === 'Todas' || comissao.ativo === (filtro === 'Ativas')),
  );

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Comissões</Text>

      {carregando ? <Text>Carregando...</Text> : null}
      {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}

      {!carregando && !erro && organizacoes.length === 0 ? (
        <Text>
          Você precisa ser administrador aprovado de uma organização autorizada para cadastrar e
          gerenciar comissões.
        </Text>
      ) : null}

      {!carregando && !erro && organizacoes.length > 0 ? (
        <View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/comissao-nova')}>
            <Text>Nova comissão</Text>
          </Pressable>

          <Text>Buscar comissão ou organização</Text>
          <TextInput value={busca} onChangeText={definirBusca} />

          <View>
            {FILTROS.map((opcao) => (
              <Pressable
                key={opcao}
                accessibilityRole="button"
                onPress={() => definirFiltro(opcao)}
              >
                <Text>
                  {filtro === opcao ? '✓ ' : ''}
                  {opcao}
                </Text>
              </Pressable>
            ))}
          </View>

          {lista.length === 0 ? (
            <Text>
              {comissoes.length === 0
                ? 'Nenhuma comissão cadastrada. Toque em Nova comissão para começar.'
                : 'Nenhuma comissão encontrada para este filtro.'}
            </Text>
          ) : null}

          {lista.map((comissao) => (
            <Pressable
              key={comissao._id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/comissao', params: { id: comissao._id } })}
            >
              <Text>{comissao.nome}</Text>
              <Text>{comissao.organizacaoId.nome}</Text>
              <Text>
                {comissao.ativo ? 'Ativa' : 'Inativa'} · {comissao.membros.length} integrante(s)
              </Text>
              {comissao.descricao ? <Text numberOfLines={2}>{comissao.descricao}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
