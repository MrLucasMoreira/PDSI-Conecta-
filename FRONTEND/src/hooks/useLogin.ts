/**
 * Estado e regras da tela de login.
 *
 * Mantém a tela declarativa: o componente cuida da apresentação e este hook
 * cuida da validação, da chamada ao serviço de autenticação e da tradução do
 * resultado em mensagens para o usuário.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import { STATUS_ACESSO, type StatusAcesso, type Usuario } from '@/models/usuario';
import { ERRO_LOGIN, MENSAGENS_ERRO_LOGIN, entrar } from '@/services/authService';
import { normalizarEmail, validarEmail, validarSenha } from '@/utils/validacao';
import { salvarToken } from '@/services/sessaoService';
import { useTema } from '@/contexts/TemaContext';

export type TomDoAviso = 'erro' | 'alerta' | 'informacao';

export type Aviso = {
  tom: TomDoAviso;
  titulo: string;
  mensagem: string;
};

type ErrosDeCampo = {
  email: string | null;
  senha: string | null;
};

const SEM_ERROS: ErrosDeCampo = { email: null, senha: null };

/**
 * Avisos exibidos quando as credenciais estão corretas, mas o cadastro do
 * usuário ainda não foi liberado pelo administrador da organização.
 */
function avisoParaStatus(usuario: Usuario): Aviso | null {
  const avisos: Record<StatusAcesso, Aviso | null> = {
    [STATUS_ACESSO.ATIVO]: null,
    [STATUS_ACESSO.PENDENTE_APROVACAO]: {
      tom: 'alerta',
      titulo: 'Cadastro em análise',
      mensagem: usuario.organizacao
        ? `A sua solicitação de acesso a ${usuario.organizacao} aguarda a aprovação de um administrador. Você receberá um aviso assim que ela for analisada.`
        : 'A sua solicitação de acesso aguarda a aprovação de um administrador.',
    },
    [STATUS_ACESSO.ACESSO_REJEITADO]: {
      tom: 'erro',
      titulo: 'Solicitação recusada',
      mensagem: usuario.organizacao
        ? `O administrador de ${usuario.organizacao} recusou a sua solicitação de acesso. Fale com a organização ou solicite acesso a outra.`
        : 'O administrador recusou a sua solicitação de acesso.',
    },
    [STATUS_ACESSO.SEM_ORGANIZACAO]: {
      tom: 'informacao',
      titulo: 'Falta vincular uma organização',
      mensagem:
        'O seu cadastro está concluído. Para usar o Conecta+, solicite acesso a uma organização e aguarde a aprovação do administrador.',
    },
  };

  return avisos[usuario.statusAcesso];
}

export function useLogin() {
  const router = useRouter();
  const { definirTemaPreferido } = useTema();

  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [senhaVisivel, definirSenhaVisivel] = useState(false);
  const [erros, definirErros] = useState<ErrosDeCampo>(SEM_ERROS);
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  /** Limpa o erro do campo assim que o usuário volta a digitar nele. */
  const aoDigitarEmail = useCallback((valor: string) => {
    definirEmail(valor);
    definirErros((atuais) => (atuais.email === null ? atuais : { ...atuais, email: null }));
    definirAviso(null);
  }, []);

  const aoDigitarSenha = useCallback((valor: string) => {
    definirSenha(valor);
    definirErros((atuais) => (atuais.senha === null ? atuais : { ...atuais, senha: null }));
    definirAviso(null);
  }, []);

  const alternarVisibilidadeDaSenha = useCallback(() => {
    definirSenhaVisivel((visivel) => !visivel);
  }, []);

  const submeter = useCallback(async () => {
    if (carregando) {
      return;
    }

    const errosEncontrados: ErrosDeCampo = {
      email: validarEmail(email),
      senha: validarSenha(senha),
    };

    definirErros(errosEncontrados);

    if (errosEncontrados.email !== null || errosEncontrados.senha !== null) {
      definirAviso(null);
      return;
    }

    definirAviso(null);
    definirCarregando(true);

    const resultado = await entrar({ email: normalizarEmail(email), senha });

    definirCarregando(false);

    if (!resultado.autenticado) {
      definirAviso({
        tom: 'erro',
        titulo:
          resultado.erro === ERRO_LOGIN.CREDENCIAIS_INVALIDAS
            ? 'Não foi possível entrar'
            : 'Erro ao entrar',
        mensagem: MENSAGENS_ERRO_LOGIN[resultado.erro],
      });
      return;
    }

    const avisoDeAcesso = avisoParaStatus(resultado.usuario);

    if (avisoDeAcesso !== null) {
      definirAviso(avisoDeAcesso);
      definirSenha('');
      return;
    }

    await Promise.all([
      salvarToken(resultado.token),
      definirTemaPreferido(resultado.usuario.tema),
    ]);

    router.replace({
      pathname: '/inicio',
      params: {
        // Dados de apresentação; operações protegidas usam o token da sessão.
        id: resultado.usuario.id,
        nome: resultado.usuario.nome,
        organizacao: resultado.usuario.organizacao ?? '',
        email: resultado.usuario.email,
        tipo: resultado.usuario.tipo,
        tema: resultado.usuario.tema,
      },
    });
  }, [carregando, definirTemaPreferido, email, senha, router]);

  return {
    email,
    senha,
    senhaVisivel,
    erros,
    aviso,
    carregando,
    aoDigitarEmail,
    aoDigitarSenha,
    alternarVisibilidadeDaSenha,
    submeter,
  };
}
