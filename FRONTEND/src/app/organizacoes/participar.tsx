/** Tela de solicitação de acesso: lista as organizações e acompanha o vínculo. */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Carregando } from '@/components/Carregando';
import { Cartao } from '@/components/Cartao';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Etiqueta, type TomEtiqueta } from '@/components/Etiqueta';
import { FaixaAviso, type Aviso } from '@/components/FaixaAviso';
import { TelaComCabecalho } from '@/components/TelaComCabecalho';
import { ESPACO, FONTES, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import { api, type Organizacao } from '@/services/api';

function situacaoDoVinculo(organizacao: Organizacao): { texto: string; tom: TomEtiqueta } | null {
  const vinculo = organizacao.meu_vinculo;
  if (!vinculo) return null;
  if (vinculo.papel === 'ADMIN') return { texto: 'Você administra esta organização', tom: 'primaria' };
  if (vinculo.status === 'PENDENTE') return { texto: 'Solicitação pendente', tom: 'alerta' };
  if (vinculo.status === 'APROVADO') return { texto: 'Acesso aprovado', tom: 'sucesso' };
  return { texto: 'Solicitação rejeitada', tom: 'erro' };
}

export default function TelaParticiparOrganizacao() {
  const { tema } = useTema();
  const [organizacoes, definirOrganizacoes] = useState<Organizacao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [enviandoId, definirEnviandoId] = useState<string | null>(null);
  const [aviso, definirAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    let ativa = true;

    void api<Organizacao[]>('/organizacoes').then((resultado) => {
      if (!ativa) return;
      definirCarregando(false);
      if (resultado.ok) definirOrganizacoes(resultado.dados);
      else definirAviso({ tom: 'erro', mensagem: resultado.erro });
    });

    return () => {
      ativa = false;
    };
  }, []);

  async function solicitar(organizacao: Organizacao) {
    definirEnviandoId(organizacao._id);
    definirAviso(null);
    const resultado = await api(`/organizacoes/${organizacao._id}/membros`, 'POST', {});
    definirEnviandoId(null);

    if (!resultado.ok) {
      definirAviso({ tom: 'erro', titulo: 'Não foi possível solicitar', mensagem: resultado.erro });
      return;
    }

    definirOrganizacoes((lista) =>
      lista.map((item) =>
        item._id === organizacao._id
          ? { ...item, meu_vinculo: { papel: 'MEMBRO', status: 'PENDENTE' } }
          : item,
      ),
    );
    definirAviso({ tom: 'sucesso', mensagem: `Solicitação enviada para ${organizacao.nome}.` });
  }

  return (
    <TelaComCabecalho titulo="Participar de uma organização">
      <Text style={[styles.introducao, { color: tema.cores.textoSuave }]}>
        Escolha uma organização aprovada e solicite acesso. O administrador dela vai analisar o
        pedido.
      </Text>

      {aviso ? <FaixaAviso aviso={aviso} /> : null}
      {carregando ? <Carregando rotulo="Carregando organizações" /> : null}
      {!carregando && organizacoes.length === 0 ? (
        <EstadoVazio icone="business-outline" mensagem="Nenhuma organização aprovada." />
      ) : null}

      {organizacoes.map((organizacao) => {
        const situacao = situacaoDoVinculo(organizacao);

        return (
          <Cartao key={organizacao._id} style={styles.cartao}>
            <Text style={[styles.nome, { color: tema.cores.texto }]}>{organizacao.nome}</Text>
            {organizacao.descricao ? (
              <Text style={[styles.texto, { color: tema.cores.textoSuave }]}>
                {organizacao.descricao}
              </Text>
            ) : null}

            {situacao ? (
              <View style={styles.rodape}>
                <Etiqueta texto={situacao.texto} tom={situacao.tom} />
              </View>
            ) : (
              <Botao
                titulo="Solicitar acesso"
                tituloCarregando="Enviando..."
                icone="enter-outline"
                compacto
                carregando={enviandoId === organizacao._id}
                aoTocar={() => solicitar(organizacao)}
                style={styles.rodape}
              />
            )}
          </Cartao>
        );
      })}
    </TelaComCabecalho>
  );
}

const styles = StyleSheet.create({
  introducao: { ...TIPOGRAFIA.corpoPequeno },
  cartao: { gap: ESPACO.sm },
  nome: { fontFamily: FONTES.titulo, fontSize: 16, lineHeight: 24 },
  texto: { ...TIPOGRAFIA.corpoPequeno },
  rodape: { marginTop: ESPACO.sm },
});
