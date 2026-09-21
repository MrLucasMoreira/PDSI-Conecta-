/**
 * Tela de solicitação de acesso a uma organização — Incremento 1.
 *
 * Versão sem estilização: mantém apenas a lógica da solicitação e o
 * acompanhamento da situação do vínculo.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import {
  listarOrganizacoes,
  solicitarAcessoOrganizacao,
  type Organizacao,
} from '@/services/organizacaoService';

export default function TelaParticiparOrganizacao() {
  const router = useRouter();
  const [organizacoes, definirOrganizacoes] = useState<Organizacao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [enviandoId, definirEnviandoId] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState<string | null>(null);

  useEffect(() => {
    let telaAtiva = true;

    void listarOrganizacoes().then((resultado) => {
      if (!telaAtiva) return;
      definirCarregando(false);
      if (resultado.sucesso) definirOrganizacoes(resultado.dados);
      else definirMensagem(resultado.mensagem);
    });

    return () => {
      telaAtiva = false;
    };
  }, []);

  async function solicitar(organizacao: Organizacao) {
    definirEnviandoId(organizacao._id);
    definirMensagem(null);
    const resultado = await solicitarAcessoOrganizacao(organizacao._id);
    definirEnviandoId(null);
    if (!resultado.sucesso) {
      definirMensagem(resultado.mensagem);
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
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      <Text>Participar de uma organização</Text>

      {carregando ? <Text accessibilityLabel="Carregando organizações">Carregando...</Text> : null}
      {mensagem ? <Text>{mensagem}</Text> : null}
      {!carregando && organizacoes.length === 0 ? <Text>Nenhuma organização aprovada.</Text> : null}

      {organizacoes.map((organizacao) => {
        const vinculo = organizacao.meuVinculo;
        const rotulo =
          vinculo?.papel === 'ADMIN'
            ? 'Você administra esta organização'
            : vinculo?.status === 'PENDENTE'
              ? 'Solicitação pendente'
              : vinculo?.status === 'APROVADO'
                ? 'Acesso aprovado'
                : vinculo?.status === 'REJEITADO'
                  ? 'Solicitação rejeitada'
                  : 'Solicitar acesso';
        const podeSolicitar = !vinculo;

        return (
          <View key={organizacao._id}>
            <Text>{organizacao.nome}</Text>
            {organizacao.descricao ? <Text>{organizacao.descricao}</Text> : null}
            <BotaoPrimario
              titulo={rotulo}
              tituloCarregando="Enviando..."
              carregando={enviandoId === organizacao._id}
              desabilitado={!podeSolicitar}
              aoTocar={() => void solicitar(organizacao)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
