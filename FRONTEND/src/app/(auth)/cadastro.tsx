import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { LogoConecta } from '@/components/LogoConecta';
import { CORES, GRADIENTE_FUNDO } from '@/constants/theme';
import { useCadastro } from '@/hooks/useCadastro';
import { useTema } from '@/contexts/TemaContext';

export default function TelaCadastro() {
  const router = useRouter();
  const { cores, temaEfetivo } = useTema();
  const gradiente = temaEfetivo === 'escuro' ? [cores.fundo, '#15182d', cores.fundo] as const : GRADIENTE_FUNDO;
  const {
    nome,
    email,
    senha,
    confirmarSenha,
    erros,
    erroGeral,
    carregando,
    definirNome,
    definirEmail,
    definirSenha,
    definirConfirmarSenha,
    submeter,
  } = useCadastro();
  const [senhaVisivel, definirSenhaVisivel] = useState(false);
  const [confirmacaoVisivel, definirConfirmacaoVisivel] = useState(false);

  return (
    <LinearGradient colors={[...gradiente]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.conteudoRolagem} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={10} style={({ pressed }) => [styles.botaoVoltar, { backgroundColor: cores.cartao }, pressed && styles.pressionado]}>
            <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
          </Pressable>

          <View style={styles.logo}><LogoConecta largura={156} /></View>

          <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
            <Text style={[styles.titulo, { color: cores.textoForte }]}>Criar conta</Text>
            <Text style={[styles.descricao, { color: cores.textoMedio }]}>Cadastre seus dados para começar a usar o Conecta+.</Text>

            <View style={styles.campos}>
              <CampoTexto rotulo="Nome" icone="person-outline" placeholder="Seu nome completo" value={nome} onChangeText={definirNome} erro={erros.nome} autoCapitalize="words" autoComplete="name" textContentType="name" />
              <CampoTexto rotulo="E-mail" icone="mail-outline" placeholder="nome@organizacao.com" value={email} onChangeText={definirEmail} erro={erros.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
              <CampoTexto rotulo="Senha" icone="lock-closed-outline" placeholder="Crie uma senha" value={senha} onChangeText={definirSenha} erro={erros.senha} secureTextEntry={!senhaVisivel} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" acaoFinal={{ icone: senhaVisivel ? 'eye-off-outline' : 'eye-outline', rotuloAcessivel: senhaVisivel ? 'Ocultar senha' : 'Mostrar senha', aoTocar: () => definirSenhaVisivel((visivel) => !visivel) }} />
              <CampoTexto rotulo="Confirmar senha" icone="lock-closed-outline" placeholder="Digite a senha novamente" value={confirmarSenha} onChangeText={definirConfirmarSenha} erro={erros.confirmarSenha} secureTextEntry={!confirmacaoVisivel} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" acaoFinal={{ icone: confirmacaoVisivel ? 'eye-off-outline' : 'eye-outline', rotuloAcessivel: confirmacaoVisivel ? 'Ocultar confirmação' : 'Mostrar confirmação', aoTocar: () => definirConfirmacaoVisivel((visivel) => !visivel) }} />
            </View>

            {erroGeral ? <Text style={styles.erroGeral}>{erroGeral}</Text> : null}
            <View style={styles.botao}><BotaoPrimario titulo="Criar conta" aoTocar={submeter} carregando={carregando} /></View>
          </View>

          <View style={styles.rodape}>
            <Text style={[styles.textoRodape, { color: cores.textoMedio }]}>Já tem uma conta? </Text>
            <Link href="/login" asChild><Pressable accessibilityRole="link" accessibilityLabel="Entrar" hitSlop={8}><Text style={styles.link}>Entrar</Text></Pressable></Link>
          </View>
        </ScrollView>
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
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: CORES.TEXTO_FORTE },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: CORES.TEXTO_MEDIO },
  campos: { marginTop: 24, gap: 16 },
  erroGeral: { marginTop: 20, textAlign: 'center', fontFamily: 'Poppins_400Regular', fontSize: 13, color: CORES.ERRO },
  botao: { marginTop: 24 },
  rodape: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textoRodape: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: CORES.TEXTO_MEDIO },
  link: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: CORES.AZUL },
});
