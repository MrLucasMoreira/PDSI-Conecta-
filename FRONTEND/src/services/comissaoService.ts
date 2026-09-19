import { URL_API } from './authService';
import { obterToken } from './sessaoService';

export type OrganizacaoComissao = { _id: string; nome: string };
export type PessoaComissao = {
  _id: string;
  nome: string;
  email: string;
  ativo?: boolean;
};
export type PapelComissao = 'MEMBRO' | 'RESPONSAVEL';
export type Comissao = {
  _id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  organizacaoId: OrganizacaoComissao;
  membros: { usuarioId: PessoaComissao | null; papel: PapelComissao }[];
};

async function requisicao<T>(
  caminho: string,
  method = 'GET',
  dados?: unknown,
): Promise<T> {
  const token = await obterToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  if (!URL_API)
    throw new Error(
      'Não foi possível falar com o servidor. Verifique a configuração da API.',
    );
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), 15000);
  try {
    const resposta = await fetch(`${URL_API}/comissoes${caminho}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: dados === undefined ? undefined : JSON.stringify(dados),
      signal: controle.signal,
    });
    if (resposta.status === 401)
      throw new Error('Sua sessão expirou. Entre novamente.');
    const corpo = await resposta.json();
    if (!resposta.ok) {
      throw new Error(
        Array.isArray(corpo.message)
          ? corpo.message.join('\n')
          : (corpo.message ?? 'Não foi possível concluir a operação.'),
      );
    }
    return corpo as T;
  } catch (erro) {
    if (
      erro instanceof TypeError ||
      (erro instanceof Error && erro.name === 'AbortError')
    ) {
      throw new Error(
        'Não foi possível falar com o servidor. Tente novamente.',
      );
    }
    throw erro;
  } finally {
    clearTimeout(tempo);
  }
}

export const listarOrganizacoesComissao = () =>
  requisicao<OrganizacaoComissao[]>('/organizacoes');
export const listarComissoes = () => requisicao<Comissao[]>('');
export const obterComissao = (id: string) =>
  requisicao<Comissao>(`/${encodeURIComponent(id)}`);
export const criarComissao = (dados: {
  nome: string;
  descricao: string;
  organizacaoId: string;
}) => requisicao<Comissao>('', 'POST', dados);
export const atualizarComissao = (
  id: string,
  dados: { nome?: string; descricao?: string; ativo?: boolean },
) => requisicao<Comissao>(`/${id}`, 'PATCH', dados);
export const desativarComissao = (id: string) =>
  requisicao<{ comissao: Comissao }>(`/${id}`, 'DELETE');
export const listarPessoasComissao = (organizacaoId: string) =>
  requisicao<PessoaComissao[]>(`/organizacoes/${organizacaoId}/membros`);
export const adicionarMembroComissao = (
  id: string,
  usuarioId: string,
  papel: PapelComissao,
) => requisicao<Comissao>(`/${id}/membros`, 'POST', { usuarioId, papel });
export const alterarPapelComissao = (
  id: string,
  usuarioId: string,
  papel: PapelComissao,
) => requisicao<Comissao>(`/${id}/membros/${usuarioId}`, 'PATCH', { papel });
export const removerMembroComissao = (id: string, usuarioId: string) =>
  requisicao<Comissao>(`/${id}/membros/${usuarioId}`, 'DELETE');
export const mensagemErroComissao = (erro: unknown) =>
  erro instanceof Error
    ? erro.message
    : 'Não foi possível concluir a operação.';
