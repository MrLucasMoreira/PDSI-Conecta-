/**
 * Gerenciamento de uma comissão e da sua equipe.
 *
 * Versão sem estilização: mantém a edição dos dados, a ativação/desativação e
 * a inclusão, promoção e remoção de integrantes.
 */

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import {
  AcaoComissao,
  ComissaoLayout,
  ConfirmacaoComissao,
} from '@/components/ComissaoLayout';
import { FormularioComissao } from '@/components/FormularioComissao';
import { CampoTexto } from '@/components/CampoTexto';
import {
  adicionarMembroComissao,
  alterarPapelComissao,
  atualizarComissao,
  desativarComissao,
  listarPessoasComissao,
  mensagemErroComissao,
  obterComissao,
  removerMembroComissao,
  type Comissao,
  type PapelComissao,
  type PessoaComissao,
} from '@/services/comissaoService';

export default function TelaDetalhesComissao() {
  const { id, criada } = useLocalSearchParams<{
    id: string;
    criada?: string;
  }>();
  const [comissao, definirComissao] = useState<Comissao | null>(null);
  const [pessoas, definirPessoas] = useState<PessoaComissao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const bloqueio = useRef(false);
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState(
    criada === '1' ? 'Comissão cadastrada! Adicione os integrantes abaixo.' : '',
  );
  const [tentativa, definirTentativa] = useState(0);
  const [busca, definirBusca] = useState('');
  const [papel, definirPapel] = useState<PapelComissao>('MEMBRO');
  const [confirmacao, definirConfirmacao] = useState<{
    mensagem: string;
    executar: () => Promise<Comissao>;
    sucesso: string;
  } | null>(null);

  useEffect(() => {
    let atual = true;
    obterComissao(id)
      .then(async (dados) => {
        const equipe = await listarPessoasComissao(dados.organizacaoId._id);
        if (atual) {
          definirComissao(dados);
          definirPessoas(equipe);
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
  }, [id, tentativa]);

  async function executar(acao: () => Promise<Comissao>, mensagem: string) {
    if (bloqueio.current) return;
    bloqueio.current = true;
    definirSalvando(true);
    definirErro('');
    definirSucesso('');
    try {
      definirComissao(await acao());
      definirSucesso(mensagem);
    } catch (e) {
      definirErro(mensagemErroComissao(e));
    } finally {
      bloqueio.current = false;
      definirSalvando(false);
      definirConfirmacao(null);
    }
  }

  const disponiveis = pessoas.filter(
    (pessoa) =>
      !comissao?.membros.some((m) => m.usuarioId?._id === pessoa._id) &&
      `${pessoa.nome} ${pessoa.email}`
        .toLocaleLowerCase()
        .includes(busca.trim().toLocaleLowerCase()),
  );

  return (
    <ComissaoLayout
      titulo="Gerenciar comissão"
      carregando={carregando}
      erro={erro}
      sucesso={sucesso}
      tentarNovamente={
        !comissao
          ? () => {
              definirCarregando(true);
              definirErro('');
              definirTentativa((v) => v + 1);
            }
          : undefined
      }
    >
      {comissao && (
        <>
          <View>
            <Text>{comissao.nome}</Text>
            <Text>
              {comissao.organizacaoId.nome} · {comissao.ativo ? 'Ativa' : 'Inativa'}
            </Text>
            <FormularioComissao
              key={comissao._id}
              nomeInicial={comissao.nome}
              descricaoInicial={comissao.descricao}
              carregando={salvando}
              salvar={(nome, descricao) => {
                void executar(
                  () => atualizarComissao(id, { nome, descricao }),
                  'Dados da comissão atualizados.',
                );
              }}
            />
            <AcaoComissao
              titulo={comissao.ativo ? 'Desativar comissão' : 'Reativar comissão'}
              desabilitado={salvando}
              aoTocar={() =>
                definirConfirmacao({
                  mensagem: comissao.ativo
                    ? `Desativar ${comissao.nome}? A equipe será preservada e poderá ser alterada após a reativação.`
                    : `Reativar ${comissao.nome}?`,
                  executar: comissao.ativo
                    ? async () => (await desativarComissao(id)).comissao
                    : () => atualizarComissao(id, { ativo: true }),
                  sucesso: comissao.ativo ? 'Comissão desativada.' : 'Comissão reativada.',
                })
              }
            />
          </View>

          <Text>Equipe ({comissao.membros.length})</Text>

          {!comissao.ativo && <Text>Reative a comissão para alterar a equipe.</Text>}

          {comissao.membros.length === 0 && <Text>Esta comissão ainda não possui integrantes.</Text>}

          {comissao.membros.map((membro, indice) => {
            const pessoa = membro.usuarioId;
            return (
              <View key={pessoa?._id ?? indice}>
                <Text>{pessoa?.nome ?? 'Usuário indisponível'}</Text>
                {!!pessoa && <Text>{pessoa.email}</Text>}
                <Text>
                  {membro.papel === 'RESPONSAVEL' ? 'Responsável' : 'Membro'}
                  {pessoa?.ativo === false ? ' · Usuário inativo' : ''}
                </Text>
                {pessoa && (
                  <View>
                    <AcaoComissao
                      titulo={
                        membro.papel === 'MEMBRO' ? 'Tornar responsável' : 'Tornar membro'
                      }
                      desabilitado={salvando || !comissao.ativo}
                      aoTocar={() => {
                        void executar(
                          () =>
                            alterarPapelComissao(
                              id,
                              pessoa._id,
                              membro.papel === 'MEMBRO' ? 'RESPONSAVEL' : 'MEMBRO',
                            ),
                          'Papel do integrante atualizado.',
                        );
                      }}
                    />
                    <AcaoComissao
                      titulo="Remover"
                      desabilitado={salvando || !comissao.ativo}
                      aoTocar={() =>
                        definirConfirmacao({
                          mensagem: `Remover ${pessoa.nome} desta comissão? O vínculo com a organização será mantido.`,
                          executar: () => removerMembroComissao(id, pessoa._id),
                          sucesso: 'Integrante removido da comissão.',
                        })
                      }
                    />
                  </View>
                )}
              </View>
            );
          })}

          {comissao.ativo && (
            <>
              <Text>Adicionar integrante</Text>
              <Text>
                Somente usuários ativos e aprovados nesta organização estão disponíveis.
              </Text>
              <CampoTexto
                rotulo="Buscar por nome ou e-mail"
                value={busca}
                onChangeText={definirBusca}
              />
              <View>
                {(['MEMBRO', 'RESPONSAVEL'] as const).map((opcao) => (
                  <AcaoComissao
                    key={opcao}
                    titulo={`${papel === opcao ? '✓ ' : ''}${opcao === 'MEMBRO' ? 'Membro' : 'Responsável'}`}
                    aoTocar={() => definirPapel(opcao)}
                    desabilitado={salvando}
                  />
                ))}
              </View>
              {disponiveis.length === 0 && (
                <Text>Nenhum integrante disponível para esta busca.</Text>
              )}
              {disponiveis.map((pessoa) => (
                <View key={pessoa._id}>
                  <Text>{pessoa.nome}</Text>
                  <Text>{pessoa.email}</Text>
                  <AcaoComissao
                    titulo={`Adicionar ${pessoa.nome}`}
                    desabilitado={salvando}
                    aoTocar={() => {
                      void executar(
                        () => adicionarMembroComissao(id, pessoa._id, papel),
                        'Integrante adicionado à comissão.',
                      );
                    }}
                  />
                </View>
              ))}
            </>
          )}

          <ConfirmacaoComissao
            mensagem={confirmacao?.mensagem}
            carregando={salvando}
            cancelar={() => definirConfirmacao(null)}
            confirmar={() => {
              if (confirmacao) void executar(confirmacao.executar, confirmacao.sucesso);
            }}
          />
        </>
      )}
    </ComissaoLayout>
  );
}
