import { useState } from 'react';
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
import type { Aviso } from '@/hooks/useLogin';
import { solicitarRecuperacao } from '@/services/authService';
import { normalizarEmail, validarEmail } from '@/utils/validacao';
import { useTema } from '@/contexts/TemaContext';

export default function TelaRecuperarConta() {
  const router = useRouter();
  const { cores, temaEfetivo } = useTema();
  const gradiente = temaEfetivo === 'escuro' ? [cores.fundo, '#15182d', cores.fundo] as const : GRADIENTE_FUNDO;
  const [email, definirEmail] = useState('');
  const [erro, definirErro] = useState<string | null>(null);
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  async function submeter() {
    const erroEmail = validarEmail(email);
    definirErro(erroEmail);
    if (erroEmail || carregando) return;

    definirCarregando(true);
    const resultado = await solicitarRecuperacao(normalizarEmail(email));
    definirCarregando(false);
    definirAviso({
      tom: resultado.sucesso ? 'informacao' : 'erro',
      titulo: resultado.sucesso ? 'Confira seu e-mail' : 'Não foi possível enviar',
      mensagem: resultado.mensagem,
    });
  }

  return (
    <LinearGradient colors={[...gradiente]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} style={[styles.voltar, { backgroundColor: cores.cartao }]} accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
            </Pressable>
            <View style={styles.logo}><LogoConecta largura={156} /></View>
            <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
              <Text style={[styles.titulo, { color: cores.textoForte }]}>Recuperar conta</Text>
              <Text style={[styles.descricao, { color: cores.textoMedio }]}>
                Informe o e-mail do cadastro. Enviaremos um link válido por 30 minutos para você criar uma nova senha.
              </Text>
              {aviso ? <View style={styles.aviso}><AvisoFormulario aviso={aviso} /></View> : null}
              <View style={styles.campo}>
                <CampoTexto
                  rotulo="E-mail"
                  icone="mail-outline"
                  placeholder="nome@organizacao.com"
                  value={email}
                  onChangeText={(valor) => { definirEmail(valor); definirErro(null); definirAviso(null); }}
                  erro={erro}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!carregando}
                  returnKeyType="send"
                  onSubmitEditing={submeter}
                />
              </View>
              <View style={styles.botao}>
                <BotaoPrimario titulo="Enviar link" tituloCarregando="Enviando..." carregando={carregando} aoTocar={submeter} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  voltar: { width: 44, height: 44, borderRadius: 22, backgroundColor: CORES.CARTAO, alignItems: 'center', justifyContent: 'center' },
  logo: { alignItems: 'center', marginTop: 20 },
  cartao: { marginTop: 28, padding: 24, borderRadius: 24, backgroundColor: CORES.CARTAO },
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: CORES.TEXTO_FORTE },
  descricao: { marginTop: 6, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21, color: CORES.TEXTO_MEDIO },
  aviso: { marginTop: 20 },
  campo: { marginTop: 24 },
  botao: { marginTop: 24 },
});
