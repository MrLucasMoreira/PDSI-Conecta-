/** Tela de solicitação de acesso: lista as organizações e acompanha o vínculo. */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api, type Organizacao } from '@/services/api';

function rotuloDoVinculo(organizacao: Organizacao) {
  const vinculo = organizacao.meuVinculo;
  if (!vinculo) return 'Solicitar acesso';
  if (vinculo.papel === 'ADMIN') return 'Você administra esta organização';
  if (vinculo.status === 'PENDENTE') return 'Solicitação pendente';
  if (vinculo.status === 'APROVADO') return 'Acesso aprovado';
  return 'Solicitação rejeitada';
}

export default function TelaParticiparOrganizacao() {
  const router = useRouter();
  const [organizacoes, definirOrganizacoes] = useState<Organizacao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [enviandoId, definirEnviandoId] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState('');

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

  async function solicitar(organizacao: Organizacao) {
    definirEnviandoId(organizacao._id);
    definirMensagem('');
    const resultado = await api(`/organizacoes/${organizacao._id}/membros`, 'POST', {});
    definirEnviandoId(null);

    if (!resultado.ok) {
      definirMensagem(resultado.erro);
      return;
    }

    definirOrganizacoes((lista) =>
      lista.map((item) =>
        item._id === organizacao._id
          ? { ...item, meuVinculo: { papel: 'MEMBRO', status: 'PENDENTE' } }
          : item,
      ),
    );
    definirMensagem(`Solicitação enviada para ${organizacao.nome}.`);
  }

  return (
    <ScrollView>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Participar de uma organização</Text>

      {carregando ? <Text>Carregando...</Text> : null}
      {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}
      {!carregando && organizacoes.length === 0 ? <Text>Nenhuma organização aprovada.</Text> : null}

      {organizacoes.map((organizacao) => {
        const enviando = enviandoId === organizacao._id;

        return (
          <View key={organizacao._id}>
            <Text>{organizacao.nome}</Text>
            {organizacao.descricao ? <Text>{organizacao.descricao}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={!!organizacao.meuVinculo || enviando}
              onPress={() => solicitar(organizacao)}
            >
              <Text>{enviando ? 'Enviando...' : rotuloDoVinculo(organizacao)}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
