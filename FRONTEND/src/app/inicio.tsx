/**
 * Destino do login bem-sucedido.
 *
 * Confirma a autenticação e a organização vinculada, e dá acesso à solicitação
 * de criação de organização do requisito "Cadastro de organização". Para o
 * administrador do sistema, também dá acesso ao gerenciamento de organizações.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { LogoConecta } from '@/components/LogoConecta';
import { CORES } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import { removerToken } from '@/services/sessaoService';

export default function TelaInicio() {
  const router = useRouter();
  const { cores } = useTema();

  const { nome, organizacao, tipo } = useLocalSearchParams<{
    nome?: string;
    organizacao?: string;
    tipo?: string;
  }>();

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.cabecalho}>
        <LogoConecta variante="simbolo" largura={40} />

        <Pressable
          onPress={() => { void removerToken().then(() => router.replace('/login')); }}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          hitSlop={10}
          style={({ pressed }) => [styles.botaoSair, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}
        >
          <Ionicons name="log-out-outline" size={18} color={CORES.TEXTO_MEDIO} />
          <Text style={[styles.textoSair, { color: cores.textoMedio }]}>Sair</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={[styles.saudacao, { color: cores.textoForte }]}>
          Olá, {nome?.split(' ')[0] ?? 'bem-vindo'}!
        </Text>

        {organizacao ? (
          <Text style={[styles.organizacao, { color: cores.textoMedio }]}>
            Você entrou como membro de {organizacao}.
          </Text>
        ) : null}

        <View style={[styles.cartaoAcesso, { backgroundColor: cores.cartao }]}>
          <View style={styles.linha}>
            <Ionicons name="checkmark-circle" size={20} color={CORES.SUCESSO} />
            <Text style={[styles.tituloCartao, { color: cores.textoForte }]}>
              Acesso liberado
            </Text>
          </View>
          <Text style={[styles.descricaoCartao, { color: cores.textoMedio }]}>
            O login do Incremento 1 está concluído. As próximas telas — início, calendário,
            reuniões e histórico — entram nos incrementos seguintes.
          </Text>
        </View>

        {tipo === 'ADMIN_SISTEMA' ? (
          <Pressable
            onPress={() => router.push('/organizacao/aprovacao')}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar organizações"
            style={({ pressed }) => [
              styles.acaoOrganizacao,
              { backgroundColor: cores.cartao },
              pressed && styles.pressionado,
            ]}
          >
            <View style={styles.iconeOrganizacao}>
              <Ionicons name="shield-checkmark-outline" size={20} color={CORES.AZUL} />
            </View>

            <View style={styles.textoOrganizacao}>
              <Text style={[styles.tituloAcao, { color: cores.textoForte }]}>Gerenciar organizações</Text>
              <Text style={[styles.descricaoAcao, { color: cores.textoMedio }]}>
                Autorize, revogue ou edite as organizações cadastradas.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={CORES.TEXTO_FRACO} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/organizacao/cadastro')}
          accessibilityRole="button"
          accessibilityLabel="Criar organização"
          style={({ pressed }) => [styles.acaoOrganizacao, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}
        >
          <View style={styles.iconeOrganizacao}>
            <Ionicons name="business-outline" size={20} color={CORES.AZUL} />
          </View>

          <View style={styles.textoOrganizacao}>
            <Text style={[styles.tituloAcao, { color: cores.textoForte }]}>Criar organização</Text>
            <Text style={[styles.descricaoAcao, { color: cores.textoMedio }]}>
              Envie o cadastro e aguarde a autorização do administrador do sistema.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={CORES.TEXTO_FRACO} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/organizacao/participar' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Participar de uma organização"
          style={({ pressed }) => [styles.acaoOrganizacao, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}
        >
          <View style={styles.iconeOrganizacao}>
            <Ionicons name="enter-outline" size={20} color={CORES.AZUL} />
          </View>
          <View style={styles.textoOrganizacao}>
            <Text style={[styles.tituloAcao, { color: cores.textoForte }]}>Participar de uma organização</Text>
            <Text style={[styles.descricaoAcao, { color: cores.textoMedio }]}>Solicite acesso e acompanhe a análise do administrador.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CORES.TEXTO_FRACO} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/organizacao/membros' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Gerenciar membros da organização"
          style={({ pressed }) => [styles.acaoOrganizacao, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}
        >
          <View style={styles.iconeOrganizacao}>
            <Ionicons name="people-circle-outline" size={20} color={CORES.AZUL} />
          </View>
          <View style={styles.textoOrganizacao}>
            <Text style={[styles.tituloAcao, { color: cores.textoForte }]}>Membros da organização</Text>
            <Text style={[styles.descricaoAcao, { color: cores.textoMedio }]}>Analise solicitações das organizações que você administra.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CORES.TEXTO_FRACO} />
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Gerenciar comissões" onPress={() => router.push('/comissoes')} style={({ pressed }) => [styles.acaoOrganizacao, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}>
          <View style={styles.iconeOrganizacao}><Ionicons name="people-outline" size={20} color={CORES.AZUL} /></View>
          <View style={styles.textoOrganizacao}>
            <Text style={[styles.tituloAcao, { color: cores.textoForte }]}>Comissões</Text>
            <Text style={[styles.descricaoAcao, { color: cores.textoMedio }]}>Cadastre comissões e gerencie suas equipes.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CORES.TEXTO_FRACO} />
        </Pressable>

        <View style={styles.linhaConfiguracoes}>
          <Pressable onPress={() => router.push('/perfil')} style={({ pressed }) => [styles.atalho, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}>
            <Ionicons name="person-circle-outline" size={22} color={CORES.AZUL} />
            <Text style={[styles.textoAtalho, { color: cores.textoForte }]}>Perfil</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/alterar-senha')} style={({ pressed }) => [styles.atalho, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}>
            <Ionicons name="key-outline" size={22} color={CORES.AZUL} />
            <Text style={[styles.textoAtalho, { color: cores.textoForte }]}>Alterar senha</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.FUNDO },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  botaoSair: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: CORES.CARTAO,
    paddingHorizontal: 16,
  },
  pressionado: { opacity: 0.9 },
  textoSair: { marginLeft: 8, fontFamily: 'Poppins_500Medium', fontSize: 13, color: CORES.TEXTO_MEDIO },
  conteudo: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  saudacao: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: CORES.TEXTO_FORTE },
  organizacao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 14, color: CORES.TEXTO_MEDIO },
  cartaoAcesso: { marginTop: 24, borderRadius: 24, backgroundColor: CORES.CARTAO, padding: 20 },
  linha: { flexDirection: 'row', alignItems: 'center' },
  tituloCartao: { marginLeft: 8, fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: CORES.TEXTO_FORTE },
  tituloAcao: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: CORES.TEXTO_FORTE },
  descricaoCartao: { marginTop: 8, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20, color: CORES.TEXTO_MEDIO },
  acaoOrganizacao: { marginTop: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 24, backgroundColor: CORES.CARTAO, padding: 20 },
  iconeOrganizacao: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: CORES.CAMPO },
  textoOrganizacao: { flex: 1, marginLeft: 12 },
  descricaoAcao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20, color: CORES.TEXTO_MEDIO },
  linhaConfiguracoes: { marginTop: 16, flexDirection: 'row', gap: 12 },
  atalho: { flex: 1, minHeight: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  textoAtalho: { marginTop: 6, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
});
