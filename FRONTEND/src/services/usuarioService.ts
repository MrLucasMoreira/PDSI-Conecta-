import { URL_API } from '@/services/authService';
import { obterToken } from '@/services/sessaoService';

export type PerfilUsuario = {
  id: string;
  nome: string;
  email: string;
};

type Resultado<T> = { sucesso: true; dados: T } | { sucesso: false; mensagem: string };

export async function requisicaoAutenticada<T>(caminho: string, init?: RequestInit): Promise<Resultado<T>> {
  const token = await obterToken();

  if (!URL_API || !token) {
    return { sucesso: false, mensagem: 'Sua sessão expirou. Entre novamente.' };
  }

  try {
    const resposta = await fetch(`${URL_API}${caminho}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });

    if (!resposta.ok) {
      const corpo = (await resposta.json().catch(() => null)) as { message?: string | string[] } | null;
      const mensagem = Array.isArray(corpo?.message) ? corpo.message[0] : corpo?.message;
      return { sucesso: false, mensagem: mensagem ?? 'Não foi possível concluir a operação.' };
    }

    return { sucesso: true, dados: (await resposta.json()) as T };
  } catch {
    return { sucesso: false, mensagem: 'Não foi possível falar com o servidor.' };
  }
}

function normalizarPerfil(dados: PerfilUsuario & { _id?: string }): PerfilUsuario {
  return { ...dados, id: dados.id ?? dados._id ?? '' };
}

export async function obterPerfil(): Promise<Resultado<PerfilUsuario>> {
  const resultado = await requisicaoAutenticada<PerfilUsuario & { _id?: string }>('/usuarios/me');
  return resultado.sucesso
    ? { sucesso: true, dados: normalizarPerfil(resultado.dados) }
    : resultado;
}

export async function atualizarPerfil(dados: {
  nome: string;
  email: string;
}): Promise<Resultado<PerfilUsuario>> {
  const resultado = await requisicaoAutenticada<PerfilUsuario & { _id?: string }>('/usuarios/me', {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
  return resultado.sucesso
    ? { sucesso: true, dados: normalizarPerfil(resultado.dados) }
    : resultado;
}

export async function alterarSenha(dados: { senhaAtual: string; novaSenha: string }) {
  return requisicaoAutenticada<{ mensagem: string }>('/usuarios/me/senha', {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}
