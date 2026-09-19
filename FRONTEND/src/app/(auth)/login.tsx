/**
 * Tela de Login do Conecta+ — Incremento 1.
 *
 * Esta tela é a porta de entrada do requisito "Cadastro de usuário":
 *   - autentica quem já se cadastrou na plataforma;
 *   - encaminha para o cadastro quem ainda não tem conta;
 *   - encaminha para a recuperação de conta quem esqueceu a senha;
 *   - informa a situação da solicitação de acesso à organização quando o
 *     administrador ainda não aprovou, quando recusou, ou quando o usuário
 *     ainda não pediu acesso a nenhuma organização.
 */

import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { LogoConecta } from '@/components/LogoConecta';
import { CORES, GRADIENTE_FUNDO } from '@/constants/theme';
import { useLogin } from '@/hooks/useLogin';
import { useTema } from '@/contexts/TemaContext';

export default function TelaLogin() {
  const campoSenha = useRef<TextInput>(null);
  const { cores, temaEfetivo } = useTema();
  const gradiente = temaEfetivo === 'escuro' ? [cores.fundo, '#15182d', cores.fundo] as const : GRADIENTE_FUNDO;

  const {
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
  } = useLogin();

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
            <View style={styles.logo}>
              <LogoConecta largura={196} />
            </View>

            <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
              <Text style={[styles.titulo, { color: cores.textoForte }]}>Entrar</Text>
              <Text style={[styles.descricao, { color: cores.textoMedio }]}>
                Acesse com a conta criada no seu cadastro para ver as reuniões da sua organização.
              </Text>

              {aviso ? (
                <View style={styles.aviso}>
                  <AvisoFormulario aviso={aviso} />
                </View>
              ) : null}

              <View style={styles.campos}>
                <CampoTexto
                  rotulo="E-mail"
                  icone="mail-outline"
                  placeholder="nome@organizacao.com"
                  value={email}
                  onChangeText={aoDigitarEmail}
                  erro={erros.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!carregando}
                  onSubmitEditing={() => campoSenha.current?.focus()}
                />

                <CampoTexto
                  ref={campoSenha}
                  rotulo="Senha"
                  icone="lock-closed-outline"
                  placeholder="Sua senha"
                  value={senha}
                  onChangeText={aoDigitarSenha}
                  erro={erros.senha}
                  secureTextEntry={!senhaVisivel}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  editable={!carregando}
                  onSubmitEditing={submeter}
                  acaoFinal={{
                    icone: senhaVisivel ? 'eye-off-outline' : 'eye-outline',
                    rotuloAcessivel: senhaVisivel ? 'Ocultar senha' : 'Mostrar senha',
                    aoTocar: alternarVisibilidadeDaSenha,
                  }}
                />
              </View>

              <View style={styles.recuperarConta}>
                <Link href="/recuperar-conta" asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Esqueci minha senha"
                    hitSlop={8}
                  >
                    <Text style={styles.linkSecundario}>
                      Esqueci minha senha
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <View style={styles.botao}>
                <BotaoPrimario titulo="Entrar" aoTocar={submeter} carregando={carregando} />
              </View>
            </View>

            <View style={styles.rodape}>
              <Text style={[styles.textoRodape, { color: cores.textoMedio }]}>
                Ainda não tem conta?{' '}
              </Text>
              <Link href="/cadastro" asChild>
                <Pressable accessibilityRole="link" accessibilityLabel="Criar conta" hitSlop={8}>
                  <Text style={styles.linkPrincipal}>Criar conta</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudoRolagem: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo: { alignItems: 'center' },
  cartao: {
    marginTop: 36,
    borderRadius: 24,
    backgroundColor: CORES.CARTAO,
    padding: 24,
    shadowColor: CORES.PRETO,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: CORES.TEXTO_FORTE },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: CORES.TEXTO_MEDIO },
  aviso: { marginTop: 20 },
  campos: { marginTop: 24, gap: 16 },
  recuperarConta: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  linkSecundario: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: CORES.AZUL },
  botao: { marginTop: 24 },
  rodape: { marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textoRodape: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: CORES.TEXTO_MEDIO },
  linkPrincipal: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: CORES.AZUL },
});
