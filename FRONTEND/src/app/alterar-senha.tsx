import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { useTema } from '@/contexts/TemaContext';
import type { Aviso } from '@/hooks/useLogin';
import { alterarSenha } from '@/services/usuarioService';
import { validarConfirmacaoSenha, validarSenha } from '@/utils/validacao';

export default function TelaAlterarSenha() {
  const router = useRouter();
  const { cores } = useTema();
  const [senhaAtual, definirSenhaAtual] = useState('');
  const [novaSenha, definirNovaSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erros, definirErros] = useState({ atual: null as string | null, nova: null as string | null, confirmacao: null as string | null });
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [carregando, definirCarregando] = useState(false);

  async function salvar() {
    const encontrados = {
      atual: validarSenha(senhaAtual),
      nova: validarSenha(novaSenha),
      confirmacao: validarConfirmacaoSenha(novaSenha, confirmacao),
    };
    definirErros(encontrados);
    if (encontrados.atual || encontrados.nova || encontrados.confirmacao || carregando) return;

    definirCarregando(true);
    const resultado = await alterarSenha({ senhaAtual, novaSenha });
    definirCarregando(false);
    if (!resultado.sucesso) {
      definirAviso({ tom: 'erro', titulo: 'Não foi possível alterar', mensagem: resultado.mensagem });
      return;
    }
    definirSenhaAtual(''); definirNovaSenha(''); definirConfirmacao('');
    definirAviso({ tom: 'informacao', titulo: 'Senha alterada', mensagem: resultado.dados.mensagem });
  }

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.cabecalho}>
        <Pressable onPress={() => router.back()} style={[styles.voltar, { backgroundColor: cores.cartao }]} accessibilityLabel="Voltar"><Ionicons name="arrow-back" size={20} color={cores.textoForte} /></Pressable>
        <Text style={[styles.tituloCabecalho, { color: cores.textoForte }]}>Alterar senha</Text><View style={styles.espaco} />
      </View>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
          <Text style={[styles.titulo, { color: cores.textoForte }]}>Segurança da conta</Text>
          <Text style={[styles.descricao, { color: cores.textoMedio }]}>Confirme sua senha atual antes de escolher uma nova.</Text>
          {aviso ? <View style={styles.aviso}><AvisoFormulario aviso={aviso} /></View> : null}
          <View style={styles.campos}>
            <CampoTexto rotulo="Senha atual" icone="lock-closed-outline" value={senhaAtual} onChangeText={(v) => { definirSenhaAtual(v); definirErros((e) => ({ ...e, atual: null })); }} erro={erros.atual} secureTextEntry />
            <CampoTexto rotulo="Nova senha" icone="key-outline" value={novaSenha} onChangeText={(v) => { definirNovaSenha(v); definirErros((e) => ({ ...e, nova: null })); }} erro={erros.nova} secureTextEntry />
            <CampoTexto rotulo="Confirmar nova senha" icone="checkmark-circle-outline" value={confirmacao} onChangeText={(v) => { definirConfirmacao(v); definirErros((e) => ({ ...e, confirmacao: null })); }} erro={erros.confirmacao} secureTextEntry />
          </View>
          <View style={styles.botao}><BotaoPrimario titulo="Alterar senha" tituloCarregando="Salvando..." carregando={carregando} aoTocar={salvar} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voltar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tituloCabecalho: { fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  espaco: { width: 44 },
  conteudo: { padding: 24, paddingTop: 4 },
  cartao: { padding: 24, borderRadius: 24 },
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22 },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20 },
  aviso: { marginTop: 20 },
  campos: { marginTop: 24, gap: 16 },
  botao: { marginTop: 24 },
});
