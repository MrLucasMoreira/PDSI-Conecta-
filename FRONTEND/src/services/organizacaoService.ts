/**
 * Serviço de organizações do Conecta+.
 *
 * Cobre o requisito "Cadastro de organização" do Incremento 1: o usuário envia
 * a solicitação e a organização nasce com status PENDENTE, aguardando a
 * autorização de um administrador do sistema.
 *
 * O cadastro nunca envia o campo `status`. Só a tela de gerenciamento, usada
 * pelo administrador do sistema, altera o status para autorizar ou revogar.
 *
 * Todas as chamadas enviam o token do login. O backend identifica pelo token
 * quem cadastrou e restringe o gerenciamento ao administrador do sistema.
 */

import { URL_API } from '@/services/authService';
import { obterToken } from '@/services/sessaoService';
import { requisicaoAutenticada } from '@/services/usuarioService';

/** Motivos pelos quais o cadastro da organização pode falhar. */
export const ERRO_ORGANIZACAO = {
  /** Já existe uma organização cadastrada com o mesmo nome. */
  NOME_EM_USO: 'NOME_EM_USO',
  /** A sessão expirou ou o backend não encontrou a conta de quem cadastrou. */
  USUARIO_NAO_ENCONTRADO: 'USUARIO_NAO_ENCONTRADO',
  /** O backend recusou os dados enviados. */
  ERRO_VALIDACAO: 'ERRO_VALIDACAO',
  /** O aplicativo não conseguiu falar com o servidor. */
  FALHA_CONEXAO: 'FALHA_CONEXAO',
  /** O servidor respondeu com um erro inesperado. */
  ERRO_SERVIDOR: 'ERRO_SERVIDOR',
} as const;

export type ErroOrganizacao = (typeof ERRO_ORGANIZACAO)[keyof typeof ERRO_ORGANIZACAO];

/** Mensagens exibidas ao usuário para cada falha do cadastro. */
export const MENSAGENS_ERRO_ORGANIZACAO: Record<ErroOrganizacao, string> = {
  [ERRO_ORGANIZACAO.NOME_EM_USO]: 'Já existe uma organização com este nome.',
  [ERRO_ORGANIZACAO.USUARIO_NAO_ENCONTRADO]:
    'Não foi possível identificar a sua conta. Entre novamente e repita a solicitação.',
  [ERRO_ORGANIZACAO.ERRO_VALIDACAO]: 'Verifique os dados informados e tente novamente.',
  [ERRO_ORGANIZACAO.FALHA_CONEXAO]:
    'Não foi possível falar com o servidor. Verifique a sua conexão e tente novamente.',
  [ERRO_ORGANIZACAO.ERRO_SERVIDOR]:
    'O servidor não conseguiu responder agora. Tente novamente em instantes.',
};

export type DadosCadastroOrganizacao = {
  nome: string;
  descricao: string;
};

export type ResultadoCadastroOrganizacao =
  | { criada: true }
  | { criada: false; erro: ErroOrganizacao };

/**
 * Envia o cadastro de uma organização.
 *
 * Sempre resolve: as falhas voltam como `{ criada: false }` para que a tela
 * exiba a mensagem correspondente em vez de tratar exceções.
 */
export async function cadastrarOrganizacao(
  dados: DadosCadastroOrganizacao,
): Promise<ResultadoCadastroOrganizacao> {
  if (URL_API === null) {
    return { criada: false, erro: ERRO_ORGANIZACAO.FALHA_CONEXAO };
  }

  const token = await obterToken();

  if (!token) {
    return { criada: false, erro: ERRO_ORGANIZACAO.USUARIO_NAO_ENCONTRADO };
  }

  const descricao = dados.descricao.trim();

  let resposta: Response;

  try {
    resposta = await fetch(`${URL_API}/organizacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nome: dados.nome.trim(),
        ...(descricao.length > 0 ? { descricao } : {}),
      }),
    });
  } catch {
    return { criada: false, erro: ERRO_ORGANIZACAO.FALHA_CONEXAO };
  }

  if (resposta.status === 409) {
    return { criada: false, erro: ERRO_ORGANIZACAO.NOME_EM_USO };
  }

  if (resposta.status === 401 || resposta.status === 403 || resposta.status === 404) {
    return { criada: false, erro: ERRO_ORGANIZACAO.USUARIO_NAO_ENCONTRADO };
  }

  if (resposta.status === 400) {
    return { criada: false, erro: ERRO_ORGANIZACAO.ERRO_VALIDACAO };
  }

  if (!resposta.ok) {
    return { criada: false, erro: ERRO_ORGANIZACAO.ERRO_SERVIDOR };
  }

  return { criada: true };
}

export type StatusOrganizacao = 'PENDENTE' | 'APROVADA' | 'REVOGADA';

export type Organizacao = {
  _id: string;
  nome: string;
  descricao?: string;
  status: StatusOrganizacao;
  criadaPor?: { nome: string; email?: string } | null;
  meuVinculo?: {
    papel: 'ADMIN' | 'MEMBRO';
    status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  } | null;
  membros?: MembroOrganizacao[];
};

export type MembroOrganizacao = {
  usuarioId: { _id: string; nome: string; email: string; ativo: boolean };
  papel: 'ADMIN' | 'MEMBRO';
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
};

export type DadosAtualizacaoOrganizacao = {
  nome?: string;
  descricao?: string;
  status?: StatusOrganizacao;
};

export function listarOrganizacoes() {
  return requisicaoAutenticada<Organizacao[]>('/organizacoes');
}

export function atualizarOrganizacao(id: string, dados: DadosAtualizacaoOrganizacao) {
  return requisicaoAutenticada<Organizacao>(`/organizacoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

export function solicitarAcessoOrganizacao(id: string) {
  return requisicaoAutenticada<{ mensagem: string }>(`/organizacoes/${id}/membros`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function buscarOrganizacao(id: string) {
  return requisicaoAutenticada<Organizacao>(`/organizacoes/${id}`);
}

export function atualizarStatusMembro(
  organizacaoId: string,
  usuarioId: string,
  status: 'APROVADO' | 'REJEITADO',
) {
  return requisicaoAutenticada<{ mensagem: string; usuarioId: string; status: string }>(
    `/organizacoes/${organizacaoId}/membros/${usuarioId}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  );
}
