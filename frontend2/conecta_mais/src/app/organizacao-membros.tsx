/** Tela de análise das solicitações de acesso das organizações que o usuário administra. */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api, type Organizacao, type StatusVinculo } from '@/services/api';

export default function TelaMembrosOrganizacao() {
  const router = useRouter();
  const [administradas, definirAdministradas] = useState<Organizacao[]>([]);
  const [selecionada, definirSelecionada] = useState<Organizacao | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [salvandoId, definirSalvandoId] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState('');

  useEffect(() => {
    let ativa = true;

    void api<Organizacao[]>('/organizacoes').then((resultado) => {
      if (!ativa) return;
      definirCarregando(false);
      if (!resultado.ok) {
        definirMensagem(resultado.erro);
        return;
      }
      definirAdministradas(
        resultado.dados.filter(
          (org) => org.meuVinculo?.papel === 'ADMIN' && org.meuVinculo.status === 'APROVADO',
        ),
      );
    });

    return () => {
      ativa = false;
    };
  }, []);

  async function abrir(organizacao: Organizacao) {
    definirCarregando(true);
    definirMensagem('');
    const resultado = await api<Organizacao>(`/organizacoes/${organizacao._id}`);
    definirCarregando(false);
    if (resultado.ok) definirSelecionada(resultado.dados);
    else definirMensagem(resultado.erro);
  }

  async function decidir(usuarioId: string, status: StatusVinculo) {
    if (!selecionada) return;

    definirSalvandoId(usuarioId);
    definirMensagem('');
    const resultado = await api(
      `/organizacoes/${selecionada._id}/membros/${usuarioId}`,
      'PATCH',
      { status },
    );
    definirSalvandoId(null);

    if (!resultado.ok) {
      definirMensagem(resultado.erro);
      return;
    }

    definirSelecionada({
      ...selecionada,
      membros: selecionada.membros?.map((membro) =>
        membro.usuarioId._id === usuarioId ? { ...membro, status } : membro,
      ),
    });
  }

  const pendentes = selecionada?.membros?.filter((membro) => membro.status === 'PENDENTE') ?? [];

  return (
    <ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => (selecionada ? definirSelecionada(null) : router.back())}
      >
        <Text>Voltar</Text>
      </Pressable>

      <Text>{selecionada?.nome ?? 'Membros da organização'}</Text>

      {carregando ? <Text>Carregando...</Text> : null}
      {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}

      {!selecionada && !carregando && administradas.length === 0 ? (
        <Text>Você ainda não administra uma organização aprovada.</Text>
      ) : null}

      {!selecionada
        ? administradas.map((org) => (
            <Pressable key={org._id} accessibilityRole="button" onPress={() => abrir(org)}>
              <Text>Ver solicitações de acesso de {org.nome}</Text>
            </Pressable>
          ))
        : null}

      {selecionada && pendentes.length === 0 ? <Text>Não há solicitações pendentes.</Text> : null}

      {pendentes.map((membro) => {
        const salvando = salvandoId === membro.usuarioId._id;

        return (
          <View key={membro.usuarioId._id}>
            <Text>{membro.usuarioId.nome}</Text>
            <Text>{membro.usuarioId.email}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={salvando}
              onPress={() => decidir(membro.usuarioId._id, 'APROVADO')}
            >
              <Text>Aprovar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={salvando}
              onPress={() => decidir(membro.usuarioId._id, 'REJEITADO')}
            >
              <Text>Rejeitar</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
