/**
 * Tela administrativa para autorizar, revogar e editar organizações.
 *
 * Versão sem estilização: mantém apenas a lógica do gerenciamento feito pelo
 * administrador do sistema.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import {
  atualizarOrganizacao,
  listarOrganizacoes,
  type DadosAtualizacaoOrganizacao,
  type Organizacao,
} from '@/services/organizacaoService';
import { validarDescricaoOrganizacao, validarNomeOrganizacao } from '@/utils/validacao';

export default function TelaGerenciarOrganizacoes() {
  const router = useRouter();
  const [organizacoes, definirOrganizacoes] = useState<Organizacao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [salvandoId, definirSalvandoId] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [editandoId, definirEditandoId] = useState<string | null>(null);
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');
  const erroNome = validarNomeOrganizacao(nome);
  const erroDescricao = validarDescricaoOrganizacao(descricao);

  async function carregar() {
    definirCarregando(true);
    definirErro(null);
    const resultado = await listarOrganizacoes();
    definirCarregando(false);

    if (resultado.sucesso) {
      definirOrganizacoes(resultado.dados);
      return;
    }

    definirErro(resultado.mensagem);
  }

  useEffect(() => {
    let telaAtiva = true;

    void listarOrganizacoes().then((resultado) => {
      if (!telaAtiva) {
        return;
      }

      definirCarregando(false);
      if (resultado.sucesso) {
        definirOrganizacoes(resultado.dados);
      } else {
        definirErro(resultado.mensagem);
      }
    });

    return () => {
      telaAtiva = false;
    };
  }, []);

  async function atualizar(id: string, dados: DadosAtualizacaoOrganizacao) {
    definirErro(null);
    definirSalvandoId(id);
    const resultado = await atualizarOrganizacao(id, dados);
    definirSalvandoId(null);

    if (!resultado.sucesso) {
      definirErro(resultado.mensagem);
      return false;
    }

    definirOrganizacoes((lista) =>
      lista.map((organizacao) => (organizacao._id === id ? resultado.dados : organizacao)),
    );
    return true;
  }

  function editar(organizacao: Organizacao) {
    definirEditandoId(organizacao._id);
    definirNome(organizacao.nome);
    definirDescricao(organizacao.descricao ?? '');
  }

  async function salvarEdicao(id: string) {
    if (erroNome || erroDescricao) {
      return;
    }

    if (await atualizar(id, { nome: nome.trim(), descricao: descricao.trim() })) {
      definirEditandoId(null);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      <Text>Gerenciar organizações</Text>

      {carregando ? <Text accessibilityLabel="Carregando">Carregando...</Text> : null}

      {erro ? (
        <View>
          <Text accessibilityRole="alert">{erro}</Text>
          <BotaoPrimario titulo="Tentar novamente" aoTocar={() => void carregar()} />
        </View>
      ) : null}

      {!carregando && !erro && organizacoes.length === 0 ? (
        <Text>Nenhuma organização cadastrada.</Text>
      ) : null}

      {organizacoes.map((organizacao) => {
        const salvando = salvandoId === organizacao._id;

        return (
          <View key={organizacao._id}>
            {editandoId === organizacao._id ? (
              <View>
                <CampoTexto
                  rotulo="Nome"
                  value={nome}
                  onChangeText={definirNome}
                  erro={erroNome}
                />
                <CampoTexto
                  rotulo="Descrição"
                  value={descricao}
                  onChangeText={definirDescricao}
                  erro={erroDescricao}
                  multiline
                />

                <BotaoPrimario
                  titulo="Salvar"
                  tituloCarregando="Salvando..."
                  carregando={salvando}
                  desabilitado={Boolean(erroNome) || Boolean(erroDescricao)}
                  aoTocar={() => void salvarEdicao(organizacao._id)}
                />
                <BotaoPrimario
                  titulo="Cancelar"
                  desabilitado={salvando}
                  aoTocar={() => definirEditandoId(null)}
                />
              </View>
            ) : (
              <View>
                <Text>{organizacao.nome}</Text>
                {organizacao.descricao ? <Text>{organizacao.descricao}</Text> : null}
                <Text>Criada por: {organizacao.criadaPor?.nome ?? '-'}</Text>
                <Text>Situação: {organizacao.status}</Text>

                {organizacao.status !== 'APROVADA' ? (
                  <BotaoPrimario
                    titulo="Autorizar"
                    desabilitado={salvando}
                    aoTocar={() => void atualizar(organizacao._id, { status: 'APROVADA' })}
                  />
                ) : null}

                {organizacao.status !== 'REVOGADA' ? (
                  <BotaoPrimario
                    titulo="Revogar"
                    desabilitado={salvando}
                    aoTocar={() => void atualizar(organizacao._id, { status: 'REVOGADA' })}
                  />
                ) : null}

                <BotaoPrimario
                  titulo="Editar"
                  desabilitado={salvando}
                  aoTocar={() => editar(organizacao)}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
