import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ComissaoLayout,
  AcaoComissao,
  estilosComissao as styles,
} from '@/components/ComissaoLayout';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { useTema } from '@/contexts/TemaContext';
import {
  listarComissoes,
  listarOrganizacoesComissao,
  mensagemErroComissao,
  type Comissao,
  type OrganizacaoComissao,
} from '@/services/comissaoService';

export default function TelaComissoes() {
  const router = useRouter();
  const { cores } = useTema();
  const [comissoes, definirComissoes] = useState<Comissao[]>([]);
  const [organizacoes, definirOrganizacoes] = useState<OrganizacaoComissao[]>(
    [],
  );
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [busca, definirBusca] = useState('');
  const [filtro, definirFiltro] = useState<'Todas' | 'Ativas' | 'Inativas'>(
    'Todas',
  );
  const [tentativa, definirTentativa] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let atual = true;
      definirCarregando(true);
      definirErro('');
      Promise.all([listarComissoes(), listarOrganizacoesComissao()])
        .then(([lista, orgs]) => {
          if (atual) {
            definirComissoes(lista);
            definirOrganizacoes(orgs);
          }
        })
        .catch((e) => {
          if (atual) definirErro(mensagemErroComissao(e));
        })
        .finally(() => {
          if (atual) definirCarregando(false);
        });
      return () => {
        atual = false;
      };
      // A tentativa recria a assinatura de foco para repetir uma consulta que falhou.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tentativa]),
  );
  const lista = comissoes.filter(
    (c) =>
      `${c.nome} ${c.organizacaoId.nome}`
        .toLocaleLowerCase()
        .includes(busca.trim().toLocaleLowerCase()) &&
      (filtro === 'Todas' || c.ativo === (filtro === 'Ativas')),
  );
  return (
    <ComissaoLayout
      titulo="Comissões"
      carregando={carregando}
      erro={erro}
      tentarNovamente={() => definirTentativa((v) => v + 1)}
    >
      {!erro && (
        <>
          <Text style={{ color: cores.textoMedio }}>
            Gerencie as comissões e equipes das organizações que você
            administra.
          </Text>
          {organizacoes.length === 0 ? (
            <Text style={{ color: cores.textoForte }}>
              Você precisa ser administrador aprovado de uma organização
              autorizada para cadastrar e gerenciar comissões.
            </Text>
          ) : (
            <>
              <BotaoPrimario
                titulo="Nova comissão"
                aoTocar={() => router.push('/comissoes/nova')}
              />
              <CampoTexto
                rotulo="Buscar comissão ou organização"
                icone="search-outline"
                value={busca}
                onChangeText={definirBusca}
              />
              <View style={styles.linha}>
                {(['Todas', 'Ativas', 'Inativas'] as const).map((opcao) => (
                  <AcaoComissao
                    key={opcao}
                    titulo={`${filtro === opcao ? '✓ ' : ''}${opcao}`}
                    aoTocar={() => definirFiltro(opcao)}
                  />
                ))}
              </View>
              {lista.length === 0 && (
                <Text style={{ color: cores.textoMedio }}>
                  {comissoes.length === 0
                    ? 'Nenhuma comissão cadastrada. Toque em Nova comissão para começar.'
                    : 'Nenhuma comissão encontrada para este filtro.'}
                </Text>
              )}
              {lista.map((comissao) => (
                <Pressable
                  key={comissao._id}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir comissão ${comissao.nome}`}
                  onPress={() =>
                    router.push({
                      pathname: '/comissoes/[id]',
                      params: { id: comissao._id },
                    })
                  }
                  style={[styles.cartao, { backgroundColor: cores.cartao }]}
                >
                  <View style={styles.linha}>
                    <Ionicons
                      name="people-outline"
                      size={22}
                      color={cores.textoForte}
                    />
                    <Text
                      style={[
                        styles.subtitulo,
                        { color: cores.textoForte, flex: 1 },
                      ]}
                    >
                      {comissao.nome}
                    </Text>
                  </View>
                  <Text style={{ color: cores.textoMedio }}>
                    {comissao.organizacaoId.nome}
                  </Text>
                  <Text style={{ color: cores.textoMedio }}>
                    {comissao.ativo ? 'Ativa' : 'Inativa'} ·{' '}
                    {comissao.membros.length} integrante(s)
                  </Text>
                  {!!comissao.descricao && (
                    <Text numberOfLines={2} style={{ color: cores.textoMedio }}>
                      {comissao.descricao}
                    </Text>
                  )}
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </ComissaoLayout>
  );
}
