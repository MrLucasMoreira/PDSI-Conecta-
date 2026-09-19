import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CORES } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import {
  listarOrganizacoes,
  solicitarAcessoOrganizacao,
  type Organizacao,
} from '@/services/organizacaoService';

export default function TelaParticiparOrganizacao() {
  const router = useRouter();
  const { cores } = useTema();
  const [organizacoes, definirOrganizacoes] = useState<Organizacao[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [enviandoId, definirEnviandoId] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState<string | null>(null);

  useEffect(() => {
    let telaAtiva = true;

    void listarOrganizacoes().then((resultado) => {
      if (!telaAtiva) return;
      definirCarregando(false);
      if (resultado.sucesso) definirOrganizacoes(resultado.dados);
      else definirMensagem(resultado.mensagem);
    });

    return () => { telaAtiva = false; };
  }, []);

  async function solicitar(organizacao: Organizacao) {
    definirEnviandoId(organizacao._id);
    definirMensagem(null);
    const resultado = await solicitarAcessoOrganizacao(organizacao._id);
    definirEnviandoId(null);
    if (!resultado.sucesso) {
      definirMensagem(resultado.mensagem);
      return;
    }
    definirOrganizacoes((lista) => lista.map((item) => item._id === organizacao._id
      ? { ...item, meuVinculo: { papel: 'MEMBRO', status: 'PENDENTE' } }
      : item));
    definirMensagem(`Solicitação enviada para ${organizacao.nome}.`);
  }

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.cabecalho}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar" style={[styles.voltar, { backgroundColor: cores.cartao }]}>
          <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
        </Pressable>
        <Text style={[styles.titulo, { color: cores.textoForte }]}>Participar de uma organização</Text>
      </View>
      <ScrollView contentContainerStyle={styles.conteudo}>
        {carregando ? <ActivityIndicator color={CORES.AZUL} /> : null}
        {mensagem ? <Text style={[styles.mensagem, { color: cores.textoMedio }]}>{mensagem}</Text> : null}
        {!carregando && organizacoes.length === 0 ? <Text style={{ color: cores.textoMedio }}>Nenhuma organização aprovada.</Text> : null}
        {organizacoes.map((organizacao) => {
          const vinculo = organizacao.meuVinculo;
          const rotulo = vinculo?.papel === 'ADMIN' ? 'Você administra esta organização'
            : vinculo?.status === 'PENDENTE' ? 'Solicitação pendente'
            : vinculo?.status === 'APROVADO' ? 'Acesso aprovado'
            : vinculo?.status === 'REJEITADO' ? 'Solicitação rejeitada'
            : 'Solicitar acesso';
          const podeSolicitar = !vinculo;
          return (
            <View key={organizacao._id} style={[styles.cartao, { backgroundColor: cores.cartao }]}>
              <Text style={[styles.nome, { color: cores.textoForte }]}>{organizacao.nome}</Text>
              {organizacao.descricao ? <Text style={[styles.descricao, { color: cores.textoMedio }]}>{organizacao.descricao}</Text> : null}
              <Pressable
                onPress={() => void solicitar(organizacao)}
                disabled={!podeSolicitar || enviandoId === organizacao._id}
                accessibilityRole="button"
                accessibilityLabel={`${rotulo}: ${organizacao.nome}`}
                style={[styles.botao, !podeSolicitar && styles.desabilitado]}
              >
                <Text style={styles.textoBotao}>{enviandoId === organizacao._id ? 'Enviando...' : rotulo}</Text>
              </Pressable>
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
  titulo: { flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  conteudo: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  mensagem: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  cartao: { padding: 18, borderRadius: 20 },
  nome: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  botao: { marginTop: 14, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: CORES.AZUL },
  desabilitado: { backgroundColor: CORES.TEXTO_FRACO },
  textoBotao: { color: CORES.BRANCO, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
});
