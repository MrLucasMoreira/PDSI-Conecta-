import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { CORES, GRADIENTE_FUNDO } from '@/constants/theme';
import type { Aviso } from '@/hooks/useLogin';
import { redefinirSenha } from '@/services/authService';
import { validarConfirmacaoSenha, validarSenha } from '@/utils/validacao';
import { useTema } from '@/contexts/TemaContext';

export default function TelaRedefinirSenha() {
  const router = useRouter();
  const { cores, temaEfetivo } = useTema();
  const gradiente = temaEfetivo === 'escuro' ? [cores.fundo, '#15182d', cores.fundo] as const : GRADIENTE_FUNDO;
  const { token = '' } = useLocalSearchParams<{ token?: string }>();
  const [senha, definirSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erros, definirErros] = useState({ senha: null as string | null, confirmacao: null as string | null });
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  async function submeter() {
    const encontrados = { senha: validarSenha(senha), confirmacao: validarConfirmacaoSenha(senha, confirmacao) };
    definirErros(encontrados);
    if (encontrados.senha || encontrados.confirmacao || carregando) return;
    if (!token) {
      definirAviso({ tom: 'erro', titulo: 'Link inválido', mensagem: 'Abra novamente o link recebido por e-mail.' });
      return;
    }

    definirCarregando(true);
    const resultado = await redefinirSenha(token, senha);
    definirCarregando(false);
    definirAviso(resultado.sucesso
      ? { tom: 'informacao', titulo: 'Senha redefinida', mensagem: 'Você já pode entrar com a nova senha.' }
      : { tom: 'erro', titulo: 'Não foi possível redefinir', mensagem: resultado.mensagem });
  }

  return (
    <LinearGradient colors={[...gradiente]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.replace('/login')} style={[styles.voltar, { backgroundColor: cores.cartao }]} accessibilityLabel="Voltar ao login">
            <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
          </Pressable>
          <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
            <Text style={[styles.titulo, { color: cores.textoForte }]}>Criar nova senha</Text>
            <Text style={[styles.descricao, { color: cores.textoMedio }]}>Escolha uma nova senha para acessar o Conecta+.</Text>
            {aviso ? <View style={styles.aviso}><AvisoFormulario aviso={aviso} /></View> : null}
            <View style={styles.campos}>
              <CampoTexto rotulo="Nova senha" icone="lock-closed-outline" placeholder="Nova senha" value={senha} onChangeText={(v) => { definirSenha(v); definirErros((e) => ({ ...e, senha: null })); }} erro={erros.senha} secureTextEntry />
              <CampoTexto rotulo="Confirmar nova senha" icone="lock-closed-outline" placeholder="Digite novamente" value={confirmacao} onChangeText={(v) => { definirConfirmacao(v); definirErros((e) => ({ ...e, confirmacao: null })); }} erro={erros.confirmacao} secureTextEntry />
            </View>
            <View style={styles.botao}><BotaoPrimario titulo="Redefinir senha" tituloCarregando="Salvando..." carregando={carregando} aoTocar={submeter} /></View>
            {aviso?.tom === 'informacao' ? <Pressable onPress={() => router.replace('/login')}><Text style={styles.link}>Voltar para o login</Text></Pressable> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  voltar: { width: 44, height: 44, borderRadius: 22, backgroundColor: CORES.CARTAO, alignItems: 'center', justifyContent: 'center' },
  cartao: { marginTop: 24, padding: 24, borderRadius: 24, backgroundColor: CORES.CARTAO },
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: CORES.TEXTO_FORTE },
  descricao: { marginTop: 6, fontFamily: 'Poppins_400Regular', fontSize: 14, color: CORES.TEXTO_MEDIO },
  aviso: { marginTop: 20 },
  campos: { marginTop: 24, gap: 16 },
  botao: { marginTop: 24 },
  link: { marginTop: 20, textAlign: 'center', fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: CORES.AZUL },
});
