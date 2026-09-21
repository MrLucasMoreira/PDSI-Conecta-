/**
 * Tela de análise das solicitações de acesso à organização — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica de aprovar ou rejeitar as
 * solicitações pendentes das organizações que o usuário administra.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import {
  atualizarStatusMembro,
  buscarOrganizacao,
  listarOrganizacoes,
  type Organizacao,
} from '@/services/organizacaoService';

export default function TelaMembrosOrganizacao() {
  const router = useRouter();
  const [administradas, definirAdministradas] = useState<Organizacao[]>([]);
  const [selecionada, definirSelecionada] = useState<Organizacao | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  useEffect(() => {
    let telaAtiva = true;

    void listarOrganizacoes().then((resultado) => {
      if (!telaAtiva) return;
      definirCarregando(false);
      if (!resultado.sucesso) {
        definirErro(resultado.mensagem);
        return;
      }
      definirAdministradas(
        resultado.dados.filter(
          (org) => org.meuVinculo?.papel === 'ADMIN' && org.meuVinculo.status === 'APROVADO',
        ),
      );
    });

    return () => {
      telaAtiva = false;
    };
  }, []);

  async function abrir(organizacao: Organizacao) {
    definirCarregando(true);
    definirErro(null);
    const resultado = await buscarOrganizacao(organizacao._id);
    definirCarregando(false);
    if (resultado.sucesso) definirSelecionada(resultado.dados);
    else definirErro(resultado.mensagem);
  }

  async function decidir(usuarioId: string, status: 'APROVADO' | 'REJEITADO') {
    if (!selecionada) return;
    definirSalvando(usuarioId);
    definirErro(null);
    const resultado = await atualizarStatusMembro(selecionada._id, usuarioId, status);
    definirSalvando(null);
    if (!resultado.sucesso) {
      definirErro(resultado.mensagem);
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
      <BotaoPrimario
        titulo="Voltar"
        aoTocar={() => (selecionada ? definirSelecionada(null) : router.back())}
      />

      <Text>{selecionada?.nome ?? 'Membros da organização'}</Text>

      {carregando ? <Text accessibilityLabel="Carregando">Carregando...</Text> : null}
      {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}

      {!selecionada && !carregando && administradas.length === 0 ? (
        <Text>Você ainda não administra uma organização aprovada.</Text>
      ) : null}

      {!selecionada &&
        administradas.map((org) => (
          <View key={org._id}>
            <Text>{org.nome}</Text>
            <BotaoPrimario
              titulo={`Ver solicitações de acesso de ${org.nome}`}
              aoTocar={() => void abrir(org)}
            />
          </View>
        ))}

      {selecionada && pendentes.length === 0 ? <Text>Não há solicitações pendentes.</Text> : null}

      {pendentes.map((membro) => (
        <View key={membro.usuarioId._id}>
          <Text>{membro.usuarioId.nome}</Text>
          <Text>{membro.usuarioId.email}</Text>
          <BotaoPrimario
            titulo={`Aprovar ${membro.usuarioId.nome}`}
            desabilitado={salvando === membro.usuarioId._id}
            aoTocar={() => void decidir(membro.usuarioId._id, 'APROVADO')}
          />
          <BotaoPrimario
            titulo={`Rejeitar ${membro.usuarioId.nome}`}
            desabilitado={salvando === membro.usuarioId._id}
            aoTocar={() => void decidir(membro.usuarioId._id, 'REJEITADO')}
          />
        </View>
      ))}
    </ScrollView>
  );
}
