/**
 * Estado e regras da tela de cadastro de organização.
 *
 * Mantém a tela declarativa, no mesmo padrão de `useLogin` e `useCadastro`: o
 * componente cuida da apresentação e este hook cuida da validação, da chamada
 * ao serviço e da tradução do resultado em mensagens para o usuário.
 */

import { useCallback, useState } from 'react';

import type { Aviso } from '@/hooks/useLogin';
import {
  ERRO_ORGANIZACAO,
  MENSAGENS_ERRO_ORGANIZACAO,
  cadastrarOrganizacao,
} from '@/services/organizacaoService';
import {
  TAMANHO_MAXIMO_DESCRICAO_ORGANIZACAO,
  validarDescricaoOrganizacao,
  validarNomeOrganizacao,
} from '@/utils/validacao';

type ErrosDeCampo = {
  nome: string | null;
  descricao: string | null;
};

const SEM_ERROS: ErrosDeCampo = { nome: null, descricao: null };

export function useCadastroOrganizacao() {
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [erros, definirErros] = useState<ErrosDeCampo>(SEM_ERROS);
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);
  const [enviada, definirEnviada] = useState(false);

  /** Limpa o erro do campo assim que o usuário volta a digitar nele. */
  const limparErro = useCallback((campo: keyof ErrosDeCampo) => {
    definirErros((atuais) => (atuais[campo] === null ? atuais : { ...atuais, [campo]: null }));
    definirAviso(null);
  }, []);

  const submeter = useCallback(async () => {
    if (carregando) {
      return;
    }

    const errosEncontrados: ErrosDeCampo = {
      nome: validarNomeOrganizacao(nome),
      descricao: validarDescricaoOrganizacao(descricao),
    };

    definirErros(errosEncontrados);

    if (Object.values(errosEncontrados).some((erro) => erro !== null)) {
      definirAviso(null);
      return;
    }

    definirAviso(null);
    definirCarregando(true);

    const resultado = await cadastrarOrganizacao({ nome, descricao });

    definirCarregando(false);

    if (resultado.criada) {
      definirEnviada(true);
      return;
    }

    // O nome repetido é erro de um campo específico, então aparece junto dele.
    if (resultado.erro === ERRO_ORGANIZACAO.NOME_EM_USO) {
      definirErros((atuais) => ({
        ...atuais,
        nome: MENSAGENS_ERRO_ORGANIZACAO[ERRO_ORGANIZACAO.NOME_EM_USO],
      }));
      return;
    }

    definirAviso({
      tom: 'erro',
      titulo: 'Não foi possível enviar',
      mensagem: MENSAGENS_ERRO_ORGANIZACAO[resultado.erro],
    });
  }, [carregando, descricao, nome]);

  return {
    nome,
    descricao,
    erros,
    aviso,
    carregando,
    /** Vira verdadeiro após o envio: a tela troca o formulário pela confirmação. */
    enviada,
    caracteresUsados: descricao.trim().length,
    limiteDeCaracteres: TAMANHO_MAXIMO_DESCRICAO_ORGANIZACAO,
    /** Mesma regra do validador, para o contador ficar coerente com o campo. */
    descricaoExcedeu: validarDescricaoOrganizacao(descricao) !== null,
    aoDigitarNome: (valor: string) => {
      definirNome(valor);
      limparErro('nome');
    },
    aoDigitarDescricao: (valor: string) => {
      definirDescricao(valor);
      limparErro('descricao');
    },
    submeter,
  };
}
