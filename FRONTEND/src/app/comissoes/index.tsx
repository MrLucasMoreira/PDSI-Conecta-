/** Lista das comissões das organizações administradas, com busca e filtro por situação. */

import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Botao } from '@/components/Botao';
import { CampoTexto } from '@/components/CampoTexto';
import { Carregando } from '@/components/Carregando';
import { Cartao } from '@/components/Cartao';
import { EstadoVazio } from '@/components/EstadoVazio';
import { Etiqueta } from '@/components/Etiqueta';
import { FaixaAviso } from '@/components/FaixaAviso';
import { Opcao } from '@/components/Opcao';
import { TelaComCabecalho } from '@/components/TelaComCabecalho';
import { ESPACO, FONTES, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import { api, type Comissao } from '@/services/api';

const FILTROS = ['Todas', 'Ativas', 'Inativas'] as const;

export default function TelaComissoes() {
  const router = useRouter();
  const { cores } = useTema().tema;
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
      `${comissao.nome} ${comissao.organizacao_id.nome}`.toLocaleLowerCase().includes(termo) &&
      (filtro === 'Todas' || comissao.ativo === (filtro === 'Ativas')),
  );

  return (
    <TelaComCabecalho titulo="Comissões">
      <Text style={[styles.introducao, { color: cores.textoSuave }]}>
        Gerencie as comissões e equipes das organizações que você administra.
      </Text>

      {erro ? <FaixaAviso aviso={{ tom: 'erro', mensagem: erro }} /> : null}
      {carregando ? <Carregando rotulo="Carregando comissões" /> : null}

      {!carregando && !erro && organizacoes.length === 0 ? (
        <EstadoVazio
          icone="shield-outline"
          mensagem="Você precisa ser administrador aprovado de uma organização autorizada para cadastrar e gerenciar comissões."
        />
      ) : null}

      {!carregando && !erro && organizacoes.length > 0 ? (
        <>
          <Botao titulo="Nova comissão" icone="add" aoTocar={() => router.push('/comissoes/nova')} />

          <CampoTexto
            rotulo="Buscar comissão ou organização"
            icone="search-outline"
            value={busca}
            onChangeText={definirBusca}
            autoCorrect={false}
            returnKeyType="search"
          />

          <View style={styles.filtros}>
            {FILTROS.map((opcao) => (
              <Opcao
                key={opcao}
                titulo={opcao}
                selecionado={filtro === opcao}
                aoTocar={() => definirFiltro(opcao)}
              />
            ))}
          </View>

          {lista.length === 0 ? (
            <EstadoVazio
              icone={comissoes.length === 0 ? 'people-outline' : 'search-outline'}
              mensagem={
                comissoes.length === 0
                  ? 'Nenhuma comissão cadastrada. Toque em Nova comissão para começar.'
                  : 'Nenhuma comissão encontrada para este filtro.'
              }
            />
          ) : null}

          {lista.map((comissao) => {
            const situacao = comissao.ativo ? 'Ativa' : 'Inativa';
            const integrantes =
              comissao.membros.length === 1
                ? '1 integrante'
                : `${comissao.membros.length} integrantes`;

            return (
              <Cartao
                key={comissao._id}
                style={styles.cartao}
                rotuloAcessivel={`Abrir comissão ${comissao.nome}, ${situacao}, ${integrantes}`}
                aoTocar={() =>
                  router.push({ pathname: '/comissoes/[id]', params: { id: comissao._id } })
                }
              >
                <View style={styles.topo}>
                  <View style={[styles.icone, { backgroundColor: cores.primariaSuave }]}>
                    <Ionicons name="people-outline" size={20} color={cores.primaria} />
                  </View>
                  <View style={styles.titulos}>
                    <Text style={[styles.nome, { color: cores.texto }]}>{comissao.nome}</Text>
                    <Text style={[styles.texto, { color: cores.textoSuave }]}>
                      {comissao.organizacao_id.nome}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={cores.textoSutil} />
                </View>

                {comissao.descricao ? (
                  <Text numberOfLines={2} style={[styles.texto, { color: cores.textoSuave }]}>
                    {comissao.descricao}
                  </Text>
                ) : null}

                <View style={styles.rodape}>
                  <Etiqueta texto={situacao} tom={comissao.ativo ? 'sucesso' : 'neutro'} />
                  <View style={styles.integrantes}>
                    <Ionicons name="person-outline" size={14} color={cores.textoSutil} />
                    <Text style={[styles.legenda, { color: cores.textoSutil }]}>{integrantes}</Text>
                  </View>
                </View>
              </Cartao>
            );
          })}
        </>
      ) : null}
    </TelaComCabecalho>
  );
}

const styles = StyleSheet.create({
  introducao: { ...TIPOGRAFIA.corpoPequeno },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO.sm },
  cartao: { gap: ESPACO.md - 4 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.md - 4 },
  icone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titulos: { flex: 1 },
  nome: { fontFamily: FONTES.titulo, fontSize: 16, lineHeight: 24 },
  texto: { ...TIPOGRAFIA.corpoPequeno },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.md - 4 },
  integrantes: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.xs },
  legenda: { ...TIPOGRAFIA.legenda },
});
