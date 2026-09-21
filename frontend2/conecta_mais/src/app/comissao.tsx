/** Gerenciamento de uma comissão: dados, situação e composição da equipe. */

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  api,
  type Comissao,
  type PapelComissao,
  type PessoaComissao,
  type Resultado,
} from '@/services/api';
import { TAMANHO_MAXIMO_DESCRICAO } from '@/utils/validacao';

const PAPEIS: { valor: PapelComissao; rotulo: string }[] = [
  { valor: 'MEMBRO', rotulo: 'Membro' },
  { valor: 'RESPONSAVEL', rotulo: 'Responsável' },
];

type Confirmacao = {
  mensagem: string;
  acao: () => Promise<Resultado<Comissao>>;
  sucesso: string;
};

export default function TelaComissao() {
  const router = useRouter();
  const { id, criada } = useLocalSearchParams<{ id: string; criada?: string }>();
  const [comissao, definirComissao] = useState<Comissao | null>(null);
  const [pessoas, definirPessoas] = useState<PessoaComissao[]>([]);
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [erroNome, definirErroNome] = useState<string | null>(null);
  const [busca, definirBusca] = useState('');
  const [papel, definirPapel] = useState<PapelComissao>('MEMBRO');
  const [confirmacao, definirConfirmacao] = useState<Confirmacao | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState(
    criada === '1' ? 'Comissão cadastrada! Adicione os integrantes abaixo.' : '',
  );

  useEffect(() => {
    let ativa = true;

    void api<Comissao>(`/comissoes/${id}`).then(async (resultado) => {
      if (!resultado.ok) {
        if (ativa) {
          definirCarregando(false);
          definirErro(resultado.erro);
        }
        return;
      }

      const equipe = await api<PessoaComissao[]>(
        `/comissoes/organizacoes/${resultado.dados.organizacaoId._id}/membros`,
      );
      if (!ativa) return;

      definirCarregando(false);
      definirComissao(resultado.dados);
      definirNome(resultado.dados.nome);
      definirDescricao(resultado.dados.descricao ?? '');
      if (equipe.ok) definirPessoas(equipe.dados);
      else definirErro(equipe.erro);
    });

    return () => {
      ativa = false;
    };
  }, [id]);

  async function executar(acao: () => Promise<Resultado<Comissao>>, mensagem: string) {
    if (salvando) return;

    definirSalvando(true);
    definirErro('');
    definirSucesso('');
    const resultado = await acao();
    definirSalvando(false);
    definirConfirmacao(null);

    if (!resultado.ok) {
      definirErro(resultado.erro);
      return;
    }

    definirComissao(resultado.dados);
    definirSucesso(mensagem);
  }

  function salvarDados() {
    if (nome.trim().length < 2) {
      definirErroNome('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    definirErroNome(null);
    void executar(
      () =>
        api<Comissao>(`/comissoes/${id}`, 'PATCH', {
          nome: nome.trim(),
          descricao: descricao.trim(),
        }),
      'Dados da comissão atualizados.',
    );
  }

  async function desativar(): Promise<Resultado<Comissao>> {
    const resultado = await api<{ comissao: Comissao }>(`/comissoes/${id}`, 'DELETE');
    return resultado.ok ? { ok: true, dados: resultado.dados.comissao } : resultado;
  }

  const termo = busca.trim().toLocaleLowerCase();
  const disponiveis = pessoas.filter(
    (pessoa) =>
      !comissao?.membros.some((membro) => membro.usuarioId?._id === pessoa._id) &&
      `${pessoa.nome} ${pessoa.email}`.toLocaleLowerCase().includes(termo),
  );

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable
        accessibilityRole="button"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/comissoes'))}
      >
        <Text>Voltar</Text>
      </Pressable>

      <Text>Gerenciar comissão</Text>

      {carregando ? <Text>Carregando...</Text> : null}
      {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}
      {sucesso ? <Text>{sucesso}</Text> : null}

      {comissao ? (
        <View>
          <Text>
            {comissao.organizacaoId.nome} · {comissao.ativo ? 'Ativa' : 'Inativa'}
          </Text>

          <Text>Nome da comissão *</Text>
          <TextInput
            value={nome}
            onChangeText={(valor) => {
              definirNome(valor);
              definirErroNome(null);
            }}
            maxLength={100}
            editable={!salvando}
          />
          {erroNome ? <Text>{erroNome}</Text> : null}

          <Text>Descrição (opcional)</Text>
          <TextInput
            value={descricao}
            onChangeText={definirDescricao}
            maxLength={TAMANHO_MAXIMO_DESCRICAO}
            multiline
            editable={!salvando}
          />

          <Pressable accessibilityRole="button" onPress={salvarDados} disabled={salvando}>
            <Text>{salvando ? 'Salvando...' : 'Salvar comissão'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={salvando}
            onPress={() =>
              definirConfirmacao({
                mensagem: comissao.ativo
                  ? `Desativar ${comissao.nome}? A equipe será preservada e poderá ser alterada após a reativação.`
                  : `Reativar ${comissao.nome}?`,
                acao: comissao.ativo
                  ? desativar
                  : () => api<Comissao>(`/comissoes/${id}`, 'PATCH', { ativo: true }),
                sucesso: comissao.ativo ? 'Comissão desativada.' : 'Comissão reativada.',
              })
            }
          >
            <Text>{comissao.ativo ? 'Desativar comissão' : 'Reativar comissão'}</Text>
          </Pressable>

          <Text>Equipe ({comissao.membros.length})</Text>

          {!comissao.ativo ? <Text>Reative a comissão para alterar a equipe.</Text> : null}
          {comissao.membros.length === 0 ? (
            <Text>Esta comissão ainda não possui integrantes.</Text>
          ) : null}

          {comissao.membros.map((membro, indice) => {
            const pessoa = membro.usuarioId;
            if (!pessoa) return <Text key={indice}>Usuário indisponível</Text>;

            const proximoPapel: PapelComissao =
              membro.papel === 'MEMBRO' ? 'RESPONSAVEL' : 'MEMBRO';

            return (
              <View key={pessoa._id}>
                <Text>{pessoa.nome}</Text>
                <Text>{pessoa.email}</Text>
                <Text>{membro.papel === 'RESPONSAVEL' ? 'Responsável' : 'Membro'}</Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={salvando || !comissao.ativo}
                  onPress={() =>
                    executar(
                      () =>
                        api<Comissao>(`/comissoes/${id}/membros/${pessoa._id}`, 'PATCH', {
                          papel: proximoPapel,
                        }),
                      'Papel do integrante atualizado.',
                    )
                  }
                >
                  <Text>
                    {membro.papel === 'MEMBRO' ? 'Tornar responsável' : 'Tornar membro'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={salvando || !comissao.ativo}
                  onPress={() =>
                    definirConfirmacao({
                      mensagem: `Remover ${pessoa.nome} desta comissão? O vínculo com a organização será mantido.`,
                      acao: () =>
                        api<Comissao>(`/comissoes/${id}/membros/${pessoa._id}`, 'DELETE'),
                      sucesso: 'Integrante removido da comissão.',
                    })
                  }
                >
                  <Text>Remover</Text>
                </Pressable>
              </View>
            );
          })}

          {comissao.ativo ? (
            <View>
              <Text>Adicionar integrante</Text>
              <Text>Somente usuários aprovados nesta organização estão disponíveis.</Text>

              <Text>Buscar por nome ou e-mail</Text>
              <TextInput value={busca} onChangeText={definirBusca} />

              {PAPEIS.map((opcao) => (
                <Pressable
                  key={opcao.valor}
                  accessibilityRole="button"
                  disabled={salvando}
                  onPress={() => definirPapel(opcao.valor)}
                >
                  <Text>
                    {papel === opcao.valor ? '✓ ' : ''}
                    {opcao.rotulo}
                  </Text>
                </Pressable>
              ))}

              {disponiveis.length === 0 ? (
                <Text>Nenhum integrante disponível para esta busca.</Text>
              ) : null}

              {disponiveis.map((pessoa) => (
                <View key={pessoa._id}>
                  <Text>{pessoa.nome}</Text>
                  <Text>{pessoa.email}</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={salvando}
                    onPress={() =>
                      executar(
                        () =>
                          api<Comissao>(`/comissoes/${id}/membros`, 'POST', {
                            usuarioId: pessoa._id,
                            papel,
                          }),
                        'Integrante adicionado à comissão.',
                      )
                    }
                  >
                    <Text>Adicionar</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Modal
        visible={!!confirmacao}
        transparent
        onRequestClose={() => !salvando && definirConfirmacao(null)}
      >
        <View>
          <Text>Confirmar alteração</Text>
          <Text>{confirmacao?.mensagem}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={salvando}
            onPress={() => {
              if (confirmacao) void executar(confirmacao.acao, confirmacao.sucesso);
            }}
          >
            <Text>{salvando ? 'Salvando...' : 'Confirmar'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={salvando}
            onPress={() => definirConfirmacao(null)}
          >
            <Text>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}
