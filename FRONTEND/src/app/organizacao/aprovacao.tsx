/** Tela administrativa para autorizar, revogar e editar organizações. */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CampoTexto } from '@/components/CampoTexto';
import { CORES } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import {
  atualizarOrganizacao,
  listarOrganizacoes,
  type DadosAtualizacaoOrganizacao,
  type Organizacao,
} from '@/services/organizacaoService';
import { validarDescricaoOrganizacao, validarNomeOrganizacao } from '@/utils/validacao';

export default function TelaGerenciarOrganizacoes() {
  const router = useRouter();
  const { cores } = useTema();
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
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.cabecalho}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.voltar, { backgroundColor: cores.cartao }]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
        </Pressable>
        <Text style={[styles.titulo, { color: cores.textoForte }]}>Gerenciar organizações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        {carregando ? <ActivityIndicator color={CORES.AZUL} /> : null}
        {erro ? (
          <View style={styles.blocoErro}>
            <Text style={styles.erro}>{erro}</Text>
            <Pressable onPress={() => void carregar()} accessibilityRole="button">
              <Text style={styles.tentarNovamente}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}
        {!carregando && !erro && organizacoes.length === 0 ? (
          <Text style={[styles.texto, { color: cores.textoMedio }]}>Nenhuma organização cadastrada.</Text>
        ) : null}

        {organizacoes.map((organizacao) => {
          const salvando = salvandoId === organizacao._id;

          return (
            <View key={organizacao._id} style={[styles.cartao, { backgroundColor: cores.cartao }]}>
              {editandoId === organizacao._id ? (
                <>
                  <CampoTexto rotulo="Nome" icone="business-outline" value={nome} onChangeText={definirNome} erro={erroNome} />
                  <CampoTexto
                    rotulo="Descrição"
                    icone="document-text-outline"
                    value={descricao}
                    onChangeText={definirDescricao}
                    erro={erroDescricao}
                    multiline
                  />

                  <View style={styles.botoes}>
                    <Pressable
                      onPress={() => void salvarEdicao(organizacao._id)}
                      disabled={salvando || Boolean(erroNome) || Boolean(erroDescricao)}
                      accessibilityRole="button"
                      style={[styles.botao, styles.botaoAutorizar, salvando && styles.desabilitado]}
                    >
                      <Text style={[styles.textoBotao, { color: CORES.BRANCO }]}>
                        {salvando ? 'Salvando...' : 'Salvar'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => definirEditandoId(null)}
                      disabled={salvando}
                      accessibilityRole="button"
                      style={[styles.botao, styles.botaoSecundario, { borderColor: cores.borda }]}
                    >
                      <Text style={[styles.textoBotao, { color: cores.textoMedio }]}>Cancelar</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.nome, { color: cores.textoForte }]}>{organizacao.nome}</Text>
                  {organizacao.descricao ? (
                    <Text style={[styles.texto, { color: cores.textoMedio }]}>{organizacao.descricao}</Text>
                  ) : null}
                  <Text style={[styles.texto, { color: cores.textoMedio }]}>
                    Criada por: {organizacao.criadaPor?.nome ?? '-'}
                  </Text>
                  <Text style={[styles.texto, { color: cores.textoMedio }]}>Situação: {organizacao.status}</Text>

                  <View style={styles.botoes}>
                    {organizacao.status !== 'APROVADA' ? (
                      <Pressable
                        onPress={() => void atualizar(organizacao._id, { status: 'APROVADA' })}
                        disabled={salvando}
                        accessibilityRole="button"
                        style={[styles.botao, styles.botaoAutorizar, salvando && styles.desabilitado]}
                      >
                        <Text style={[styles.textoBotao, { color: CORES.BRANCO }]}>Autorizar</Text>
                      </Pressable>
                    ) : null}

                    {organizacao.status !== 'REVOGADA' ? (
                      <Pressable
                        onPress={() => void atualizar(organizacao._id, { status: 'REVOGADA' })}
                        disabled={salvando}
                        accessibilityRole="button"
                        style={[styles.botao, styles.botaoRevogar, salvando && styles.desabilitado]}
                      >
                        <Text style={[styles.textoBotao, { color: CORES.ERRO }]}>Revogar</Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      onPress={() => editar(organizacao)}
                      disabled={salvando}
                      accessibilityRole="button"
                      style={[styles.botao, styles.botaoSecundario, { borderColor: cores.borda }]}
                    >
                      <Text style={[styles.textoBotao, { color: cores.textoMedio }]}>Editar</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 },
  voltar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  conteudo: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  blocoErro: { gap: 8 },
  erro: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: CORES.ERRO },
  tentarNovamente: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: CORES.AZUL },
  cartao: { padding: 16, borderRadius: 20, gap: 8 },
  nome: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  texto: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  botoes: { marginTop: 8, flexDirection: 'row', gap: 8 },
  botao: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  botaoAutorizar: { backgroundColor: CORES.AZUL },
  botaoRevogar: { borderWidth: 1, borderColor: CORES.ERRO },
  botaoSecundario: { borderWidth: 1 },
  textoBotao: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'center' },
  desabilitado: { opacity: 0.6 },
});
