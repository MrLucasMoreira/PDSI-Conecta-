/**
 * Serviço de autenticação do Conecta+.
 *
 * Cobre o requisito de login do Incremento 1 e os estados que nascem do
 * requisito "Cadastro de usuário":
 *   - o usuário se cadastra na plataforma;
 *   - o usuário solicita acesso a uma organização;
 *   - o administrador da organização aprova ou rejeita a solicitação.
 *
 * O serviço usa exclusivamente a API NestJS configurada em
 * `EXPO_PUBLIC_API_URL`.
 */

import type { Usuario } from '@/models/usuario';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Motivos pelos quais o login pode falhar. */
export const ERRO_LOGIN = {
  /** E-mail inexistente ou senha incorreta (mensagem única, para não revelar quais contas existem). */
  CREDENCIAIS_INVALIDAS: 'CREDENCIAIS_INVALIDAS',
  /** Conta desativada por um administrador do sistema. */
  CONTA_DESATIVADA: 'CONTA_DESATIVADA',
  /** O aplicativo não conseguiu falar com o servidor. */
  FALHA_CONEXAO: 'FALHA_CONEXAO',
  /** O servidor respondeu com erro inesperado. */
  ERRO_SERVIDOR: 'ERRO_SERVIDOR',
} as const;

export type ErroLogin = (typeof ERRO_LOGIN)[keyof typeof ERRO_LOGIN];

export type Credenciais = {
  email: string;
  senha: string;
};

export type DadosCadastro = {
  nome: string;
  email: string;
  senha: string;
};

export type ResultadoLogin =
  | { autenticado: true; usuario: Usuario; token: string }
  | { autenticado: false; erro: ErroLogin };

/**
 * URL da API do incremento.
 *
 * Durante o desenvolvimento nativo, `localhost` seria o próprio celular. O
 * Expo informa o endereço do computador em `hostUri`; usamos esse endereço
 * para alcançar o NestJS pela mesma rede do bundler.
 */
function obterUrlApi() {
  const configurada = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

  if (!configurada) {
    return null;
  }

  if (Platform.OS === 'web' || !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configurada)) {
    return configurada;
  }

  const hostExpo = Constants.expoConfig?.hostUri?.split(':')[0];

  if (!hostExpo) {
    return configurada;
  }

  const url = new URL(configurada);
  url.hostname = hostExpo;
  return url.toString().replace(/\/$/, '');
}

export const URL_API = obterUrlApi();

/** Mensagens exibidas ao usuário para cada falha de login. */
export const MENSAGENS_ERRO_LOGIN: Record<ErroLogin, string> = {
  [ERRO_LOGIN.CREDENCIAIS_INVALIDAS]:
    'E-mail ou senha incorretos. Verifique os dados e tente novamente.',
  [ERRO_LOGIN.CONTA_DESATIVADA]:
    'Esta conta foi desativada. Procure o administrador do sistema.',
  [ERRO_LOGIN.FALHA_CONEXAO]:
    'Não foi possível falar com o servidor. Verifique a sua conexão e tente novamente.',
  [ERRO_LOGIN.ERRO_SERVIDOR]:
    'O servidor não conseguiu responder agora. Tente novamente em instantes.',
};

async function autenticarNaApi(credenciais: Credenciais): Promise<ResultadoLogin> {
  if (URL_API === null) {
    return { autenticado: false, erro: ERRO_LOGIN.FALHA_CONEXAO };
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${URL_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credenciais),
    });
  } catch {
    return { autenticado: false, erro: ERRO_LOGIN.FALHA_CONEXAO };
  }

  if (resposta.status === 401 || resposta.status === 404) {
    return { autenticado: false, erro: ERRO_LOGIN.CREDENCIAIS_INVALIDAS };
  }

  if (resposta.status === 403) {
    return { autenticado: false, erro: ERRO_LOGIN.CONTA_DESATIVADA };
  }

  if (!resposta.ok) {
    return { autenticado: false, erro: ERRO_LOGIN.ERRO_SERVIDOR };
  }

  try {
    const corpo = (await resposta.json()) as {
      accessToken?: string;
      token?: string;
      usuario?: {
        id: string;
        nome: string;
        email: string;
        tipo?: string;
        statusAcesso?: Usuario['statusAcesso'];
        organizacao?: string | null;
      };
    };

    if (!corpo.accessToken && !corpo.token) {
      return { autenticado: false, erro: ERRO_LOGIN.ERRO_SERVIDOR };
    }

    if (!corpo.usuario) {
      return { autenticado: false, erro: ERRO_LOGIN.ERRO_SERVIDOR };
    }

    // O backend libera somente usuários ativos e ainda não envia os campos de
    // organização/status usados pelas telas do incremento 1.
    const usuario: Usuario = {
      id: corpo.usuario.id,
      nome: corpo.usuario.nome,
      email: corpo.usuario.email,
      tipo: corpo.usuario.tipo ?? 'USUARIO',
      statusAcesso: corpo.usuario.statusAcesso ?? 'ATIVO',
      organizacao: corpo.usuario.organizacao ?? null,
    };

    return {
      autenticado: true,
      usuario,
      token: corpo.accessToken ?? corpo.token!,
    };
  } catch {
    return { autenticado: false, erro: ERRO_LOGIN.ERRO_SERVIDOR };
  }
}

/**
 * Autentica o usuário com e-mail e senha.
 *
 * Sempre resolve: as falhas são devolvidas como `{ autenticado: false }` para que
 * a tela exiba a mensagem correspondente em vez de tratar exceções.
 */
export async function entrar(credenciais: Credenciais): Promise<ResultadoLogin> {
  return autenticarNaApi(credenciais);
}

export type ResultadoCadastro =
  | { criado: true }
  | { criado: false; erro: 'EMAIL_EXISTENTE' | 'ERRO_VALIDACAO' | 'FALHA_CONEXAO' | 'ERRO_SERVIDOR' };

export async function cadastrar(dados: DadosCadastro): Promise<ResultadoCadastro> {
  if (URL_API === null) {
    return { criado: false, erro: 'FALHA_CONEXAO' };
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${URL_API}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  } catch {
    return { criado: false, erro: 'FALHA_CONEXAO' };
  }

  if (resposta.status === 409) {
    return { criado: false, erro: 'EMAIL_EXISTENTE' };
  }

  if (resposta.status === 400) {
    return { criado: false, erro: 'ERRO_VALIDACAO' };
  }

  if (!resposta.ok) {
    return { criado: false, erro: 'ERRO_SERVIDOR' };
  }

  return { criado: true };
}

export async function solicitarRecuperacao(email: string) {
  if (!URL_API) {
    return { sucesso: false as const, mensagem: 'Não foi possível falar com o servidor.' };
  }

  try {
    const resposta = await fetch(`${URL_API}/auth/recuperar-conta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!resposta.ok) {
      return { sucesso: false as const, mensagem: 'Não foi possível solicitar a recuperação.' };
    }

    const corpo = (await resposta.json()) as { mensagem: string };
    return { sucesso: true as const, mensagem: corpo.mensagem };
  } catch {
    return { sucesso: false as const, mensagem: 'Não foi possível falar com o servidor.' };
  }
}

export async function redefinirSenha(token: string, novaSenha: string) {
  if (!URL_API) {
    return { sucesso: false as const, mensagem: 'Não foi possível falar com o servidor.' };
  }

  try {
    const resposta = await fetch(`${URL_API}/auth/redefinir-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, novaSenha }),
    });

    const corpo = (await resposta.json().catch(() => null)) as { mensagem?: string; message?: string } | null;

    if (!resposta.ok) {
      return {
        sucesso: false as const,
        mensagem: corpo?.message ?? 'O link de recuperação é inválido ou expirou.',
      };
    }

    return { sucesso: true as const, mensagem: corpo?.mensagem ?? 'Senha redefinida.' };
  } catch {
    return { sucesso: false as const, mensagem: 'Não foi possível falar com o servidor.' };
  }
}
