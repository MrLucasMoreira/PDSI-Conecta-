import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  AcaoComissao,
  ComissaoLayout,
  ConfirmacaoComissao,
  estilosComissao as styles,
} from '@/components/ComissaoLayout';
import { FormularioComissao } from '@/components/FormularioComissao';
import { CampoTexto } from '@/components/CampoTexto';
import { useTema } from '@/contexts/TemaContext';
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
  const { cores } = useTema();
  const [comissao, definirComissao] = useState<Comissao | null>(null);
  const [pessoas, definirPessoas] = useState<PessoaComissao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const bloqueio = useRef(false);
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState(
    criada === '1'
      ? 'Comissão cadastrada! Adicione os integrantes abaixo.'
      : '',
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
          <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
            <Text style={[styles.subtitulo, { color: cores.textoForte }]}>
              {comissao.nome}
            </Text>
            <Text style={{ color: cores.textoMedio }}>
              {comissao.organizacaoId.nome} ·{' '}
              {comissao.ativo ? 'Ativa' : 'Inativa'}
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
              titulo={
                comissao.ativo ? 'Desativar comissão' : 'Reativar comissão'
              }
              perigo={comissao.ativo}
              desabilitado={salvando}
              aoTocar={() =>
                definirConfirmacao({
                  mensagem: comissao.ativo
                    ? `Desativar ${comissao.nome}? A equipe será preservada e poderá ser alterada após a reativação.`
                    : `Reativar ${comissao.nome}?`,
                  executar: comissao.ativo
                    ? async () => (await desativarComissao(id)).comissao
                    : () => atualizarComissao(id, { ativo: true }),
                  sucesso: comissao.ativo
                    ? 'Comissão desativada.'
                    : 'Comissão reativada.',
                })
              }
            />
          </View>
          <Text style={[styles.subtitulo, { color: cores.textoForte }]}>
            Equipe ({comissao.membros.length})
          </Text>
          {!comissao.ativo && (
            <Text style={{ color: cores.textoMedio }}>
              Reative a comissão para alterar a equipe.
            </Text>
          )}
          {comissao.membros.length === 0 && (
            <Text style={{ color: cores.textoMedio }}>
              Esta comissão ainda não possui integrantes.
            </Text>
          )}
          {comissao.membros.map((membro, indice) => {
            const pessoa = membro.usuarioId;
            return (
              <View
                key={pessoa?._id ?? indice}
                style={[styles.cartao, { backgroundColor: cores.cartao }]}
              >
                <Text
                  style={{
                    color: cores.textoForte,
                    fontFamily: 'Poppins_600SemiBold',
                  }}
                >
                  {pessoa?.nome ?? 'Usuário indisponível'}
                </Text>
                {!!pessoa && (
                  <Text style={{ color: cores.textoMedio }}>
                    {pessoa.email}
                  </Text>
                )}
                <Text style={{ color: cores.textoMedio }}>
                  {membro.papel === 'RESPONSAVEL' ? 'Responsável' : 'Membro'}
                  {pessoa?.ativo === false ? ' · Usuário inativo' : ''}
                </Text>
                {pessoa && (
                  <View style={styles.linha}>
                    <AcaoComissao
                      titulo={
                        membro.papel === 'MEMBRO'
                          ? 'Tornar responsável'
                          : 'Tornar membro'
                      }
                      desabilitado={salvando || !comissao.ativo}
                      aoTocar={() => {
                        void executar(
                          () =>
                            alterarPapelComissao(
                              id,
                              pessoa._id,
                              membro.papel === 'MEMBRO'
                                ? 'RESPONSAVEL'
                                : 'MEMBRO',
                            ),
                          'Papel do integrante atualizado.',
                        );
                      }}
                    />
                    <AcaoComissao
                      titulo="Remover"
                      perigo
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
              <Text style={[styles.subtitulo, { color: cores.textoForte }]}>
                Adicionar integrante
              </Text>
              <Text style={{ color: cores.textoMedio }}>
                Somente usuários ativos e aprovados nesta organização estão
                disponíveis.
              </Text>
              <CampoTexto
                rotulo="Buscar por nome ou e-mail"
                icone="search-outline"
                value={busca}
                onChangeText={definirBusca}
              />
              <View style={styles.linha}>
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
                <Text style={{ color: cores.textoMedio }}>
                  Nenhum integrante disponível para esta busca.
                </Text>
              )}
              {disponiveis.map((pessoa) => (
                <View
                  key={pessoa._id}
                  style={[styles.cartao, { backgroundColor: cores.cartao }]}
                >
                  <Text style={{ color: cores.textoForte }}>{pessoa.nome}</Text>
                  <Text style={{ color: cores.textoMedio }}>
                    {pessoa.email}
                  </Text>
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
              if (confirmacao)
                void executar(confirmacao.executar, confirmacao.sucesso);
            }}
          />
        </>
      )}
    </ComissaoLayout>
  );
}
