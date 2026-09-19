/**
 * Modelo de usuário do Conecta+ (Incremento 1).
 *
 * Fica em um módulo próprio porque é compartilhado pelo serviço de
 * autenticação e pelas telas.
 */

/** Situação do usuário perante a organização a que ele pediu acesso. */
export const STATUS_ACESSO = {
  /** Cadastro aprovado por um administrador: o usuário pode usar o aplicativo. */
  ATIVO: 'ATIVO',
  /** Cadastro concluído, mas o usuário ainda não solicitou acesso a nenhuma organização. */
  SEM_ORGANIZACAO: 'SEM_ORGANIZACAO',
  /** Solicitação enviada e aguardando decisão do administrador da organização. */
  PENDENTE_APROVACAO: 'PENDENTE_APROVACAO',
  /** Solicitação recusada pelo administrador da organização. */
  ACESSO_REJEITADO: 'ACESSO_REJEITADO',
} as const;

export type StatusAcesso = (typeof STATUS_ACESSO)[keyof typeof STATUS_ACESSO];

export const TEMAS = {
  CLARO: 'claro',
  ESCURO: 'escuro',
  SISTEMA: 'sistema',
} as const;

export type TemaUsuario = (typeof TEMAS)[keyof typeof TEMAS];

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  /** USUARIO ou ADMIN_SISTEMA (administrador do sistema). */
  tipo: string;
  tema: TemaUsuario;
  statusAcesso: StatusAcesso;
  /** Nome da organização vinculada, quando o usuário já solicitou acesso a alguma. */
  organizacao: string | null;
};
