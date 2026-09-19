/**
 * Tela de cadastro de organização — Incremento 1.
 *
 * Atende ao primeiro item do requisito "Cadastro de organização": o usuário
 * realiza o cadastro de uma nova organização. A autorização e a revogação são
 * do administrador do sistema e acontecem no backend, por isso esta tela nunca
 * envia o status: a organização sempre nasce pendente.
 *
 * Depois do envio, o formulário dá lugar à confirmação, deixando claro que a
 * organização ainda depende da análise do administrador do sistema.
 */

import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { LogoConecta } from '@/components/LogoConecta';
import { CORES, GRADIENTE_FUNDO } from '@/constants/theme';
import { useCadastroOrganizacao } from '@/hooks/useCadastroOrganizacao';
import { useTema } from '@/contexts/TemaContext';

export default function TelaCadastroOrganizacao() {
  const router = useRouter();
  const { cores, temaEfetivo } = useTema();
  const gradiente = temaEfetivo === 'escuro' ? [cores.fundo, '#15182d', cores.fundo] as const : GRADIENTE_FUNDO;

  const {
    nome,
    descricao,
    erros,
    aviso,
    carregando,
    enviada,
    caracteresUsados,
    limiteDeCaracteres,
    descricaoExcedeu,
    aoDigitarNome,
    aoDigitarDescricao,
    submeter,
  } = useCadastroOrganizacao();

  return (
    <LinearGradient colors={[...gradiente]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.conteudoRolagem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={10}
              style={({ pressed }) => [styles.botaoVoltar, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}
            >
              <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
            </Pressable>

            <View style={styles.logo}>
              <LogoConecta largura={156} />
            </View>

            <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
              {enviada ? (
                <>
                  <View style={[styles.iconeSituacao, { backgroundColor: cores.campo }]}>
                    <Ionicons name="time" size={24} color={CORES.ALERTA} />
                  </View>

                  <Text style={[styles.tituloEnviado, { color: cores.textoForte }]}>
                    Solicitação enviada
                  </Text>

                  <Text style={[styles.descricaoEnviado, { color: cores.textoMedio }]}>
                    A organização {nome.trim()} foi cadastrada e aguarda a autorização de um
                    administrador do sistema. Você será avisado assim que ela for analisada.
                  </Text>

                  <View style={[styles.etiqueta, { backgroundColor: cores.campo }]}>
                    <Text style={[styles.textoEtiqueta, { color: cores.textoMedio }]}>
                      Situação atual: aguardando autorização
                    </Text>
                  </View>

                  <View style={styles.botao}>
                    <BotaoPrimario titulo="Voltar ao início" aoTocar={() => router.back()} />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.titulo, { color: cores.textoForte }]}>Criar organização</Text>

                  <Text style={[styles.descricao, { color: cores.textoMedio }]}>
                    Informe os dados da organização. O cadastro passa pela autorização de um
                    administrador do sistema antes de ficar disponível.
                  </Text>

                  {aviso ? (
                    <View style={styles.aviso}>
                      <AvisoFormulario aviso={aviso} />
                    </View>
                  ) : null}

                  <View style={styles.campos}>
                    <CampoTexto
                      rotulo="Nome da organização"
                      icone="business-outline"
                      placeholder="Ex.: Conselho Municipal de Educação"
                      value={nome}
                      onChangeText={aoDigitarNome}
                      erro={erros.nome}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      editable={!carregando}
                    />

                    <View>
                      <CampoTexto
                        rotulo="Descrição (opcional)"
                        icone="document-text-outline"
                        placeholder="Diga em poucas palavras o que a organização faz."
                        value={descricao}
                        onChangeText={aoDigitarDescricao}
                        erro={erros.descricao}
                        multiline
                        autoCapitalize="sentences"
                        editable={!carregando}
                      />

                      <Text
                        style={[styles.contador, { color: descricaoExcedeu ? CORES.ERRO : CORES.TEXTO_FRACO }]}
                      >
                        {caracteresUsados}/{limiteDeCaracteres}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.botao}>
                    <BotaoPrimario
                      titulo="Enviar solicitação"
                      aoTocar={submeter}
                      carregando={carregando}
                      tituloCarregando="Enviando..."
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudoRolagem: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
  botaoVoltar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: CORES.CARTAO },
  pressionado: { opacity: 0.85 },
  logo: { marginTop: 20, alignItems: 'center' },
  cartao: {
    marginTop: 28,
    borderRadius: 24,
    backgroundColor: CORES.CARTAO,
    padding: 24,
    shadowColor: CORES.PRETO,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconeSituacao: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: CORES.CAMPO },
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: CORES.TEXTO_FORTE },
  tituloEnviado: { marginTop: 16, fontFamily: 'Poppins_700Bold', fontSize: 22, color: CORES.TEXTO_FORTE },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: CORES.TEXTO_MEDIO },
  descricaoEnviado: { marginTop: 8, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: CORES.TEXTO_MEDIO },
  etiqueta: { alignSelf: 'flex-start', marginTop: 20, borderRadius: 999, backgroundColor: CORES.CAMPO, paddingHorizontal: 16, paddingVertical: 8 },
  textoEtiqueta: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: CORES.TEXTO_MEDIO },
  aviso: { marginTop: 20 },
  campos: { marginTop: 24, gap: 16 },
  contador: { marginTop: 8, textAlign: 'right', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  botao: { marginTop: 24 },
});
