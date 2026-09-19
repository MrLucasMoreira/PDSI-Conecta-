import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { CORES } from '@/constants/theme';
import { useTema } from '@/contexts/TemaContext';
import type { Aviso } from '@/hooks/useLogin';
import { TEMAS, type TemaUsuario } from '@/models/usuario';
import { atualizarPerfil, obterPerfil } from '@/services/usuarioService';
import { normalizarEmail, validarEmail, validarNome } from '@/utils/validacao';

const OPCOES_TEMA: { valor: TemaUsuario; titulo: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { valor: TEMAS.SISTEMA, titulo: 'Sistema', icone: 'phone-portrait-outline' },
  { valor: TEMAS.CLARO, titulo: 'Claro', icone: 'sunny-outline' },
  { valor: TEMAS.ESCURO, titulo: 'Escuro', icone: 'moon-outline' },
];

export default function TelaPerfil() {
  const router = useRouter();
  const { cores, temaPreferido, definirTemaPreferido } = useTema();
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [tema, definirTema] = useState<TemaUsuario>(temaPreferido);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [aviso, definirAviso] = useState<Aviso | null>(null);
  const [erros, definirErros] = useState({ nome: null as string | null, email: null as string | null });

  useEffect(() => {
    void obterPerfil().then((resultado) => {
      definirCarregando(false);
      if (!resultado.sucesso) {
        definirAviso({ tom: 'erro', titulo: 'Não foi possível carregar', mensagem: resultado.mensagem });
        return;
      }
      definirNome(resultado.dados.nome);
      definirEmail(resultado.dados.email);
      definirTema(resultado.dados.tema);
      void definirTemaPreferido(resultado.dados.tema);
    });
  }, [definirTemaPreferido]);

  async function salvar() {
    const encontrados = { nome: validarNome(nome), email: validarEmail(email) };
    definirErros(encontrados);
    if (encontrados.nome || encontrados.email || salvando) return;

    definirSalvando(true);
    const resultado = await atualizarPerfil({ nome: nome.trim(), email: normalizarEmail(email), tema });
    definirSalvando(false);

    if (!resultado.sucesso) {
      definirAviso({ tom: 'erro', titulo: 'Não foi possível salvar', mensagem: resultado.mensagem });
      return;
    }

    await definirTemaPreferido(resultado.dados.tema);
    definirAviso({ tom: 'informacao', titulo: 'Perfil atualizado', mensagem: 'Seus dados e sua preferência de tema foram salvos.' });
  }

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.cabecalho}>
        <Pressable onPress={() => router.back()} style={[styles.voltar, { backgroundColor: cores.cartao }]} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={20} color={cores.textoForte} />
        </Pressable>
        <Text style={[styles.tituloCabecalho, { color: cores.textoForte }]}>Perfil</Text>
        <View style={styles.espacoCabecalho} />
      </View>

      {carregando ? (
        <View style={styles.carregando}><ActivityIndicator color={CORES.AZUL} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <View style={[styles.cartao, { backgroundColor: cores.cartao }]}>
            <Text style={[styles.titulo, { color: cores.textoForte }]}>Dados pessoais</Text>
            <Text style={[styles.descricao, { color: cores.textoMedio }]}>Atualize as informações usadas na sua conta.</Text>
            {aviso ? <View style={styles.aviso}><AvisoFormulario aviso={aviso} /></View> : null}
            <View style={styles.campos}>
              <CampoTexto rotulo="Nome" icone="person-outline" value={nome} onChangeText={(v) => { definirNome(v); definirErros((e) => ({ ...e, nome: null })); }} erro={erros.nome} autoCapitalize="words" />
              <CampoTexto rotulo="E-mail" icone="mail-outline" value={email} onChangeText={(v) => { definirEmail(v); definirErros((e) => ({ ...e, email: null })); }} erro={erros.email} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <Text style={[styles.rotuloTema, { color: cores.textoMedio }]}>Tema preferido</Text>
            <View style={styles.opcoesTema}>
              {OPCOES_TEMA.map((opcao) => {
                const selecionado = tema === opcao.valor;
                return (
                  <Pressable
                    key={opcao.valor}
                    onPress={() => {
                      definirTema(opcao.valor);
                      void definirTemaPreferido(opcao.valor);
                    }}
                    style={[styles.opcaoTema, { backgroundColor: selecionado ? CORES.AZUL : cores.campo, borderColor: selecionado ? CORES.AZUL : cores.borda }]}
                  >
                    <Ionicons name={opcao.icone} size={18} color={selecionado ? CORES.BRANCO : cores.textoMedio} />
                    <Text style={[styles.textoTema, { color: selecionado ? CORES.BRANCO : cores.textoMedio }]}>{opcao.titulo}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.botao}><BotaoPrimario titulo="Salvar alterações" tituloCarregando="Salvando..." carregando={salvando} aoTocar={salvar} /></View>
            <Pressable onPress={() => router.push('/alterar-senha')} style={[styles.acaoSenha, { borderColor: cores.borda }]}>
              <Ionicons name="key-outline" size={20} color={CORES.AZUL} />
              <Text style={styles.textoAcaoSenha}>Alterar minha senha</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voltar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tituloCabecalho: { fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  espacoCabecalho: { width: 44 },
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: 24, paddingTop: 4 },
  cartao: { padding: 24, borderRadius: 24 },
  titulo: { fontFamily: 'Poppins_700Bold', fontSize: 22 },
  descricao: { marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  aviso: { marginTop: 20 },
  campos: { marginTop: 24, gap: 16 },
  rotuloTema: { marginTop: 24, marginBottom: 8, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  opcoesTema: { flexDirection: 'row', gap: 8 },
  opcaoTema: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  textoTema: { marginLeft: 6, fontFamily: 'Poppins_500Medium', fontSize: 12 },
  botao: { marginTop: 24 },
  acaoSenha: { marginTop: 16, height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textoAcaoSenha: { marginLeft: 8, color: CORES.AZUL, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
});
