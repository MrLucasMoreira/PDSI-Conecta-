/** Tela de análise das solicitações de acesso das organizações que o usuário administra. */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { Botao } from '@/components/Botao';
import { Carregando } from '@/components/Carregando';
import { Cartao } from '@/components/Cartao';
import { EstadoVazio } from '@/components/EstadoVazio';
import { FaixaAviso } from '@/components/FaixaAviso';
import { ItemMenu } from '@/components/ItemMenu';
import { TelaComCabecalho } from '@/components/TelaComCabecalho';
import { ESPACO, FONTES, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import { api, type Organizacao, type StatusVinculo } from '@/services/api';

export default function TelaMembrosOrganizacao() {
  const router = useRouter();
  const { tema } = useTema();
  const { cores } = tema;
  const [administradas, definirAdministradas] = useState<Organizacao[]>([]);
  const [selecionada, definirSelecionada] = useState<Organizacao | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [salvandoId, definirSalvandoId] = useState<string | null>(null);
  const [erro, definirErro] = useState('');

  useEffect(() => {
    let ativa = true;

    void api<Organizacao[]>('/organizacoes').then((resultado) => {
      if (!ativa) return;
      definirCarregando(false);
      if (!resultado.ok) {
        definirErro(resultado.erro);
        return;
      }
      definirAdministradas(
        resultado.dados.filter(
          (org) => org.meu_vinculo?.papel === 'ADMIN' && org.meu_vinculo.status === 'APROVADO',
        ),
      );
    });

    return () => {
      ativa = false;
    };
  }, []);

  async function abrir(organizacao: Organizacao) {
    definirCarregando(true);
    definirErro('');
    const resultado = await api<Organizacao>(`/organizacoes/${organizacao._id}`);
    definirCarregando(false);
    if (resultado.ok) definirSelecionada(resultado.dados);
    else definirErro(resultado.erro);
  }

  async function decidir(usuarioId: string, status: StatusVinculo) {
    if (!selecionada) return;

    definirSalvandoId(usuarioId);
    definirErro('');
    const resultado = await api(
      `/organizacoes/${selecionada._id}/membros/${usuarioId}`,
      'PATCH',
      { status },
    );
    definirSalvandoId(null);

    if (!resultado.ok) {
      definirErro(resultado.erro);
      return;
    }

    definirSelecionada({
      ...selecionada,
      membros: selecionada.membros?.map((membro) =>
        membro.usuario_id._id === usuarioId ? { ...membro, status } : membro,
      ),
    });
  }

  const pendentes = selecionada?.membros?.filter((membro) => membro.status === 'PENDENTE') ?? [];

  return (
    <TelaComCabecalho
      titulo={selecionada?.nome ?? 'Membros da organização'}
      aoVoltar={selecionada ? () => definirSelecionada(null) : () => router.back()}
    >
      {erro ? <FaixaAviso aviso={{ tom: 'erro', mensagem: erro }} /> : null}
      {carregando ? <Carregando /> : null}

      {!selecionada && !carregando ? (
        administradas.length === 0 ? (
          <EstadoVazio
            icone="business-outline"
            mensagem="Você ainda não administra uma organização aprovada."
          />
        ) : (
          <>
            <Text style={[styles.introducao, { color: cores.textoSuave }]}>
              Escolha a organização para analisar as solicitações de acesso.
            </Text>
            {administradas.map((org) => (
              <ItemMenu
                key={org._id}
                titulo={org.nome}
                descricao="Ver solicitações de acesso"
                icone="people-outline"
                aoTocar={() => abrir(org)}
              />
            ))}
          </>
        )
      ) : null}

      {selecionada && !carregando ? (
        pendentes.length === 0 ? (
          <EstadoVazio icone="checkmark-done-outline" mensagem="Não há solicitações pendentes." />
        ) : (
          <Text style={[styles.introducao, { color: cores.textoSuave }]}>
            {pendentes.length === 1
              ? '1 solicitação aguardando análise.'
              : `${pendentes.length} solicitações aguardando análise.`}
          </Text>
        )
      ) : null}

      {selecionada && !carregando
        ? pendentes.map((membro) => {
            const salvando = salvandoId === membro.usuario_id._id;

            return (
              <Cartao key={membro.usuario_id._id} style={styles.cartao}>
                <View style={styles.pessoa}>
                  <Avatar nome={membro.usuario_id.nome} />
                  <View style={styles.dados}>
                    <Text style={[styles.nome, { color: cores.texto }]}>
                      {membro.usuario_id.nome}
                    </Text>
                    <Text style={[styles.email, { color: cores.textoSuave }]}>
                      {membro.usuario_id.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.botoes}>
                  <Botao
                    titulo="Aprovar"
                    icone="checkmark"
                    compacto
                    desabilitado={salvando}
                    aoTocar={() => decidir(membro.usuario_id._id, 'APROVADO')}
                    style={styles.botao}
                  />
                  <Botao
                    titulo="Rejeitar"
                    icone="close"
                    variante="perigo"
                    compacto
                    desabilitado={salvando}
                    aoTocar={() => decidir(membro.usuario_id._id, 'REJEITADO')}
                    style={styles.botao}
                  />
                </View>
              </Cartao>
            );
          })
        : null}
    </TelaComCabecalho>
  );
}

const styles = StyleSheet.create({
  introducao: { ...TIPOGRAFIA.corpoPequeno },
  cartao: { gap: ESPACO.md },
  pessoa: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.md - 4 },
  dados: { flex: 1 },
  nome: { fontFamily: FONTES.titulo, fontSize: 15, lineHeight: 22 },
  email: { ...TIPOGRAFIA.corpoPequeno },
  botoes: { flexDirection: 'row', gap: ESPACO.sm },
  botao: { flex: 1 },
});
