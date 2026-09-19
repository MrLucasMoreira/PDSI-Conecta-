import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import { cadastrar } from '@/services/authService';
import {
  normalizarEmail,
  validarConfirmacaoSenha,
  validarEmail,
  validarNome,
  validarSenha,
} from '@/utils/validacao';

type ErrosCadastro = {
  nome: string | null;
  email: string | null;
  senha: string | null;
  confirmarSenha: string | null;
};

const SEM_ERROS: ErrosCadastro = {
  nome: null,
  email: null,
  senha: null,
  confirmarSenha: null,
};

export function useCadastro() {
  const router = useRouter();
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [confirmarSenha, definirConfirmarSenha] = useState('');
  const [erros, definirErros] = useState<ErrosCadastro>(SEM_ERROS);
  const [carregando, definirCarregando] = useState(false);
  const [erroGeral, definirErroGeral] = useState<string | null>(null);

  const limparErro = useCallback((campo: keyof ErrosCadastro) => {
    definirErros((atuais) => (atuais[campo] === null ? atuais : { ...atuais, [campo]: null }));
    definirErroGeral(null);
  }, []);

  const submeter = useCallback(async () => {
    if (carregando) return;

    const errosEncontrados: ErrosCadastro = {
      nome: validarNome(nome),
      email: validarEmail(email),
      senha: validarSenha(senha),
      confirmarSenha: validarConfirmacaoSenha(senha, confirmarSenha),
    };

    definirErros(errosEncontrados);
    definirErroGeral(null);

    if (Object.values(errosEncontrados).some((erro) => erro !== null)) return;

    definirCarregando(true);
    const resultado = await cadastrar({ nome: nome.trim(), email: normalizarEmail(email), senha });
    definirCarregando(false);

    if (resultado.criado) {
      router.replace('/login');
      return;
    }

    if (resultado.erro === 'EMAIL_EXISTENTE') {
      definirErros((atuais) => ({ ...atuais, email: 'Este e-mail já está cadastrado.' }));
    } else if (resultado.erro === 'ERRO_VALIDACAO') {
      definirErroGeral('Verifique os dados informados e tente novamente.');
    } else if (resultado.erro === 'FALHA_CONEXAO') {
      definirErroGeral('Não foi possível falar com o servidor. Tente novamente.');
    } else {
      definirErroGeral('Não foi possível criar a conta agora. Tente novamente em instantes.');
    }
  }, [carregando, confirmarSenha, email, nome, router, senha]);

  return {
    nome,
    email,
    senha,
    confirmarSenha,
    erros,
    erroGeral,
    carregando,
    definirNome: (valor: string) => { definirNome(valor); limparErro('nome'); },
    definirEmail: (valor: string) => { definirEmail(valor); limparErro('email'); },
    definirSenha: (valor: string) => { definirSenha(valor); limparErro('senha'); },
    definirConfirmarSenha: (valor: string) => { definirConfirmarSenha(valor); limparErro('confirmarSenha'); },
    submeter,
  };
}
