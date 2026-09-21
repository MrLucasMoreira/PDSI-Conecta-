/**
 * Cadastro de uma nova comissão dentro de uma organização administrada.
 *
 * Versão sem estilização: mantém a seleção da organização e o formulário.
 */

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AcaoComissao, ComissaoLayout } from '@/components/ComissaoLayout';
import { FormularioComissao } from '@/components/FormularioComissao';
import {
  criarComissao,
  listarOrganizacoesComissao,
  mensagemErroComissao,
  type OrganizacaoComissao,
} from '@/services/comissaoService';

export default function TelaNovaComissao() {
  const router = useRouter();
  const [organizacoes, definirOrganizacoes] = useState<OrganizacaoComissao[]>([]);
  const [organizacaoId, definirOrganizacaoId] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const bloqueio = useRef(false);
  const [erro, definirErro] = useState('');
  const [tentativa, definirTentativa] = useState(0);

  useEffect(() => {
    let atual = true;
    listarOrganizacoesComissao()
      .then((orgs) => {
        if (atual) {
          definirOrganizacoes(orgs);
          definirOrganizacaoId(orgs[0]?._id ?? '');
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
  }, [tentativa]);

  async function salvar(nome: string, descricao: string) {
    if (bloqueio.current) return;
    if (!organizacaoId) {
      definirErro('Selecione uma organização.');
      return;
    }
    bloqueio.current = true;
    definirSalvando(true);
    definirErro('');
    try {
      const comissao = await criarComissao({ nome, descricao, organizacaoId });
      router.replace({
        pathname: '/comissoes/[id]',
        params: { id: comissao._id, criada: '1' },
      });
    } catch (e) {
      definirErro(mensagemErroComissao(e));
    } finally {
      bloqueio.current = false;
      definirSalvando(false);
    }
  }

  return (
    <ComissaoLayout
      titulo="Nova comissão"
      carregando={carregando}
      erro={erro}
      tentarNovamente={
        organizacoes.length === 0
          ? () => {
              definirCarregando(true);
              definirErro('');
              definirTentativa((v) => v + 1);
            }
          : undefined
      }
    >
      {organizacoes.length === 0 ? (
        <Text>
          Nenhuma organização disponível. É necessário ser administrador aprovado de uma
          organização autorizada.
        </Text>
      ) : (
        <>
          <Text>
            Selecione a organização e informe os dados da comissão. Depois de salvar, você poderá
            montar a equipe.
          </Text>
          <Text>Organização *</Text>
          <View>
            {organizacoes.map((org) => (
              <AcaoComissao
                key={org._id}
                titulo={`${org._id === organizacaoId ? '✓ ' : ''}${org.nome}`}
                aoTocar={() => definirOrganizacaoId(org._id)}
                desabilitado={salvando}
              />
            ))}
          </View>
          <FormularioComissao
            salvar={(nome, descricao) => {
              void salvar(nome, descricao);
            }}
            carregando={salvando}
            titulo="Cadastrar comissão"
          />
        </>
      )}
    </ComissaoLayout>
  );
}
