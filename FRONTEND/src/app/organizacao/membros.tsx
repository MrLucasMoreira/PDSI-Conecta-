import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CORES } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import {
  atualizarStatusMembro,
  buscarOrganizacao,
  listarOrganizacoes,
  type Organizacao,
} from '@/services/organizacaoService';

export default function TelaMembrosOrganizacao() {
  const router = useRouter();
  const { cores } = useTema();
  const [administradas, definirAdministradas] = useState<Organizacao[]>([]);
  const [selecionada, definirSelecionada] = useState<Organizacao | null>(null);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  useEffect(() => {
    let telaAtiva = true;

    void listarOrganizacoes().then((resultado) => {
      if (!telaAtiva) return;
      definirCarregando(false);
      if (!resultado.sucesso) {
        definirErro(resultado.mensagem);
        return;
      }
      definirAdministradas(resultado.dados.filter((org) =>
        org.meuVinculo?.papel === 'ADMIN' && org.meuVinculo.status === 'APROVADO'));
    });

    return () => { telaAtiva = false; };
  }, []);

  async function abrir(organizacao: Organizacao) {
    definirCarregando(true);
    definirErro(null);
    const resultado = await buscarOrganizacao(organizacao._id);
    definirCarregando(false);
    if (resultado.sucesso) definirSelecionada(resultado.dados);
    else definirErro(resultado.mensagem);
  }

  async function decidir(usuarioId: string, status: 'APROVADO' | 'REJEITADO') {
    if (!selecionada) return;
    definirSalvando(usuarioId);
    definirErro(null);
    const resultado = await atualizarStatusMembro(selecionada._id, usuarioId, status);
    definirSalvando(null);
    if (!resultado.sucesso) { definirErro(resultado.mensagem); return; }
    definirSelecionada({ ...selecionada, membros: selecionada.membros?.map((membro) =>
      membro.usuarioId._id === usuarioId ? { ...membro, status } : membro) });
  }

  const pendentes = selecionada?.membros?.filter((membro) => membro.status === 'PENDENTE') ?? [];

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.cabecalho}>
        <Pressable onPress={() => selecionada ? definirSelecionada(null) : router.back()} accessibilityRole="button" accessibilityLabel="Voltar" style={[styles.voltar, { backgroundColor: cores.cartao }]}>
          <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
        </Pressable>
        <Text style={[styles.titulo, { color: cores.textoForte }]}>{selecionada?.nome ?? 'Membros da organização'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.conteudo}>
        {carregando ? <ActivityIndicator color={CORES.AZUL} /> : null}
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        {!selecionada && !carregando && administradas.length === 0 ? <Text style={{ color: cores.textoMedio }}>Você ainda não administra uma organização aprovada.</Text> : null}
        {!selecionada && administradas.map((org) => (
          <Pressable key={org._id} onPress={() => void abrir(org)} accessibilityRole="button" accessibilityLabel={`Gerenciar membros de ${org.nome}`} style={[styles.cartao, { backgroundColor: cores.cartao }]}>
            <Text style={[styles.nome, { color: cores.textoForte }]}>{org.nome}</Text>
            <Text style={[styles.descricao, { color: cores.textoMedio }]}>Ver solicitações de acesso</Text>
          </Pressable>
        ))}
        {selecionada && pendentes.length === 0 ? <Text style={{ color: cores.textoMedio }}>Não há solicitações pendentes.</Text> : null}
        {pendentes.map((membro) => (
          <View key={membro.usuarioId._id} style={[styles.cartao, { backgroundColor: cores.cartao }]}>
            <Text style={[styles.nome, { color: cores.textoForte }]}>{membro.usuarioId.nome}</Text>
            <Text style={[styles.descricao, { color: cores.textoMedio }]}>{membro.usuarioId.email}</Text>
            <View style={styles.acoes}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Aprovar ${membro.usuarioId.nome}`} disabled={salvando === membro.usuarioId._id} onPress={() => void decidir(membro.usuarioId._id, 'APROVADO')} style={[styles.botao, styles.aprovar]}><Text style={styles.textoBotao}>Aprovar</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Rejeitar ${membro.usuarioId.nome}`} disabled={salvando === membro.usuarioId._id} onPress={() => void decidir(membro.usuarioId._id, 'REJEITADO')} style={[styles.botao, styles.rejeitar]}><Text style={[styles.textoBotao, { color: CORES.ERRO }]}>Rejeitar</Text></Pressable>
            </View>
          </View>
        ))}
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
  erro: { color: CORES.ERRO, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  cartao: { padding: 18, borderRadius: 20 },
  nome: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 14 },
  botao: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aprovar: { backgroundColor: CORES.AZUL },
  rejeitar: { borderWidth: 1, borderColor: CORES.ERRO },
  textoBotao: { color: CORES.BRANCO, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
});
