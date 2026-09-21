/** Tela de dados pessoais: carrega e salva o nome e o e-mail da conta. */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import { normalizarEmail, validarEmail, validarNome } from '@/utils/validacao';

type Perfil = { nome: string; email: string };

export default function TelaPerfil() {
  const router = useRouter();
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [erros, definirErros] = useState<{ nome: string | null; email: string | null }>({
    nome: null,
    email: null,
  });
  const [mensagem, definirMensagem] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);

  useEffect(() => {
    let ativa = true;

    void api<Perfil>('/usuarios/me').then((resultado) => {
      if (!ativa) return;
      definirCarregando(false);
      if (!resultado.ok) {
        definirMensagem(resultado.erro);
        return;
      }
      definirNome(resultado.dados.nome);
      definirEmail(resultado.dados.email);
    });

    return () => {
      ativa = false;
    };
  }, []);

  async function salvar() {
    const encontrados = { nome: validarNome(nome), email: validarEmail(email) };
    definirErros(encontrados);
    definirMensagem('');
    if (encontrados.nome || encontrados.email || salvando) return;

    definirSalvando(true);
    const resultado = await api<Perfil>('/usuarios/me', 'PATCH', {
      nome: nome.trim(),
      email: normalizarEmail(email),
    });
    definirSalvando(false);
    definirMensagem(resultado.ok ? 'Seus dados foram salvos.' : resultado.erro);
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      <Text>Perfil</Text>

      {carregando ? (
        <Text>Carregando...</Text>
      ) : (
        <View>
          <Text>Atualize as informações usadas na sua conta.</Text>

          {mensagem ? <Text accessibilityRole="alert">{mensagem}</Text> : null}

          <View>
            <Text>Nome</Text>
            <TextInput
              value={nome}
              onChangeText={(valor) => {
                definirNome(valor);
                definirErros((atuais) => ({ ...atuais, nome: null }));
              }}
              autoCapitalize="words"
              editable={!salvando}
            />
            {erros.nome ? <Text>{erros.nome}</Text> : null}
          </View>

          <View>
            <Text>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={(valor) => {
                definirEmail(valor);
                definirErros((atuais) => ({ ...atuais, email: null }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!salvando}
            />
            {erros.email ? <Text>{erros.email}</Text> : null}
          </View>

          <Pressable accessibilityRole="button" onPress={salvar} disabled={salvando}>
            <Text>{salvando ? 'Salvando...' : 'Salvar alterações'}</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.push('/alterar-senha')}>
            <Text>Alterar minha senha</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
