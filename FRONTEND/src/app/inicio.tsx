/** Tela de início: reúne os atalhos dos fluxos do aplicativo e o acesso ao perfil. */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ItemMenu } from '@/components/ItemMenu';
import { Logo } from '@/components/Logo';
import { ESPACO, FONTES, RAIO, TIPOGRAFIA } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';

type Atalho = {
  titulo: string;
  descricao?: string;
  icone: keyof typeof Ionicons.glyphMap;
  destino: Href;
};

const ATALHO_ADMINISTRADOR: Atalho = {
  titulo: 'Gerenciar organizações',
  descricao: 'Autorize, revogue ou edite as organizações cadastradas.',
  icone: 'shield-checkmark-outline',
  destino: '/organizacoes/aprovacao',
};

const ATALHOS: Atalho[] = [
  {
    titulo: 'Criar organização',
    descricao: 'Envie o cadastro e aguarde a autorização do administrador do sistema.',
    icone: 'business-outline',
    destino: '/organizacoes/cadastro',
  },
  {
    titulo: 'Participar de uma organização',
    descricao: 'Solicite acesso às organizações aprovadas.',
    icone: 'enter-outline',
    destino: '/organizacoes/participar',
  },
  {
    titulo: 'Membros da organização',
    descricao: 'Aprove ou rejeite as solicitações de acesso.',
    icone: 'person-add-outline',
    destino: '/organizacoes/membros',
  },
  {
    titulo: 'Comissões',
    descricao: 'Cadastre comissões e gerencie suas equipes.',
    icone: 'people-outline',
    destino: '/comissoes',
  },
];

export default function TelaInicio() {
  const router = useRouter();
  const { cores } = useTema().tema;
  const { nome, organizacao, tipo } = useLocalSearchParams<{
    nome?: string;
    organizacao?: string;
    tipo?: string;
  }>();
  const atalhos = tipo === 'ADMIN_SISTEMA' ? [ATALHO_ADMINISTRADOR, ...ATALHOS] : ATALHOS;

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]} edges={['top', 'bottom']}>
      <View style={styles.cabecalho}>
        <Logo variante="simbolo" largura={40} />

        <Pressable
          onPress={() => router.push('/perfil')}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          hitSlop={8}
          style={({ pressed }) => [
            styles.perfil,
            { backgroundColor: cores.superficie, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="person-circle-outline" size={20} color={cores.primaria} />
          <Text style={[styles.textoPerfil, { color: cores.texto }]}>Perfil</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={[styles.saudacao, { color: cores.texto }]}>
          Olá, {nome?.split(' ')[0] ?? 'bem-vindo'}!
        </Text>
        <Text style={[styles.subtitulo, { color: cores.textoSuave }]}>
          {organizacao
            ? `Você entrou como membro de ${organizacao}.`
            : 'O que você deseja fazer hoje?'}
        </Text>

        <View style={styles.lista}>
          {atalhos.map((atalho) => (
            <ItemMenu
              key={atalho.titulo}
              titulo={atalho.titulo}
              descricao={atalho.descricao}
              icone={atalho.icone}
              aoTocar={() => router.push(atalho.destino)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACO.lg,
    paddingTop: ESPACO.sm,
  },
  perfil: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.sm,
    paddingHorizontal: ESPACO.md,
    borderRadius: RAIO.circulo,
  },
  textoPerfil: { fontFamily: FONTES.corpoMedio, fontSize: 14, lineHeight: 20 },
  conteudo: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: ESPACO.lg,
    paddingBottom: ESPACO.xxl,
  },
  saudacao: { ...TIPOGRAFIA.titulo, marginTop: ESPACO.sm },
  subtitulo: { ...TIPOGRAFIA.corpoPequeno, marginTop: ESPACO.xs },
  lista: { marginTop: ESPACO.lg, gap: ESPACO.md },
});
