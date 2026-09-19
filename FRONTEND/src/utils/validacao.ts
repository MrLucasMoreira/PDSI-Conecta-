/**
 * Validações de formulário compartilhadas pelas telas de autenticação.
 *
 * Requisito não funcional atendido: "Validação próxima ao campo que precisa de
 * correção" (padrões para telas descritos em PropostaInicial/objetivos.md).
 */

/** Tamanho mínimo de senha aceito no cadastro e no login. */
export const TAMANHO_MINIMO_SENHA = 8;

/** Tamanho mínimo do nome aceito no cadastro. */
export const TAMANHO_MINIMO_NOME = 3;

const EXPRESSAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Remove espaços das pontas e normaliza o e-mail para comparação. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Valida o campo de e-mail.
 * @returns a mensagem de erro a ser exibida no campo, ou `null` quando válido.
 */
export function validarEmail(email: string): string | null {
  const valor = email.trim();

  if (valor.length === 0) {
    return 'Informe o seu e-mail.';
  }

  if (!EXPRESSAO_EMAIL.test(valor)) {
    return 'Informe um e-mail válido, como nome@dominio.com.';
  }

  return null;
}

/**
 * Valida o campo de senha no login.
 * @returns a mensagem de erro a ser exibida no campo, ou `null` quando válida.
 */
export function validarSenha(senha: string): string | null {
  if (senha.length === 0) {
    return 'Informe a sua senha.';
  }

  if (senha.length < TAMANHO_MINIMO_SENHA) {
    return `A senha deve ter ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }

  return null;
}

export function validarNome(nome: string): string | null {
  if (nome.trim().length === 0) {
    return 'Informe o seu nome.';
  }

  if (nome.trim().length < TAMANHO_MINIMO_NOME) {
    return `O nome deve ter ao menos ${TAMANHO_MINIMO_NOME} caracteres.`;
  }

  return null;
}

export function validarConfirmacaoSenha(senha: string, confirmacao: string): string | null {
  if (confirmacao.length === 0) {
    return 'Confirme a sua senha.';
  }

  if (senha !== confirmacao) {
    return 'As senhas não coincidem.';
  }

  return null;
}

/** Tamanho mínimo do nome de organização, igual ao exigido pelo backend. */
export const TAMANHO_MINIMO_NOME_ORGANIZACAO = 2;

/** Tamanho máximo da descrição da organização. */
export const TAMANHO_MAXIMO_DESCRICAO_ORGANIZACAO = 200;

export function validarNomeOrganizacao(nome: string): string | null {
  const valor = nome.trim();

  if (valor.length === 0) {
    return 'Informe o nome da organização.';
  }

  if (valor.length < TAMANHO_MINIMO_NOME_ORGANIZACAO) {
    return `O nome deve ter ao menos ${TAMANHO_MINIMO_NOME_ORGANIZACAO} caracteres.`;
  }

  return null;
}

/** A descrição é opcional, por isso o campo vazio é considerado válido. */
export function validarDescricaoOrganizacao(descricao: string): string | null {
  if (descricao.trim().length > TAMANHO_MAXIMO_DESCRICAO_ORGANIZACAO) {
    return `A descrição deve ter no máximo ${TAMANHO_MAXIMO_DESCRICAO_ORGANIZACAO} caracteres.`;
  }

  return null;
}
