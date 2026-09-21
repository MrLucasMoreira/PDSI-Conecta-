/** Tela de cadastro de organização: a solicitação nasce pendente de autorização. */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import {
  TAMANHO_MAXIMO_DESCRICAO,
  validarDescricao,
  validarNomeOrganizacao,
} from '@/utils/validacao';

export default function TelaCadastroOrganizacao() {
  const router = useRouter();
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [erros, definirErros] = useState<{ nome: string | null; descricao: string | null }>({
    nome: null,
    descricao: null,
  });
  const [erro, definirErro] = useState('');
  const [enviada, definirEnviada] = useState(false);
  const [carregando, definirCarregando] = useState(false);

  async function enviar() {
    const encontrados = {
      nome: validarNomeOrganizacao(nome),
      descricao: validarDescricao(descricao),
    };
    definirErros(encontrados);
    definirErro('');
    if (encontrados.nome || encontrados.descricao || carregando) return;

    const texto = descricao.trim();
    definirCarregando(true);
    const resultado = await api('/organizacoes', 'POST', {
      nome: nome.trim(),
      ...(texto ? { descricao: texto } : {}),
    });
    definirCarregando(false);

    if (!resultado.ok) {
      definirErro(resultado.erro);
      return;
    }

    definirEnviada(true);
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text>Voltar</Text>
      </Pressable>

      {enviada ? (
        <View>
          <Text>Solicitação enviada</Text>
          <Text>
            A organização {nome.trim()} foi cadastrada e aguarda a autorização de um administrador
            do sistema.
          </Text>
        </View>
      ) : (
        <View>
          <Text>Criar organização</Text>
          <Text>
            Informe os dados da organização. O cadastro passa pela autorização de um administrador
            do sistema antes de ficar disponível.
          </Text>

          {erro ? <Text accessibilityRole="alert">{erro}</Text> : null}

          <View>
            <Text>Nome da organização</Text>
            <TextInput
              placeholder="Ex.: Conselho Municipal de Educação"
              value={nome}
              onChangeText={(valor) => {
                definirNome(valor);
                definirErros((atuais) => ({ ...atuais, nome: null }));
                definirErro('');
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!carregando}
            />
            {erros.nome ? <Text>{erros.nome}</Text> : null}
          </View>

          <View>
            <Text>Descrição (opcional)</Text>
            <TextInput
              placeholder="Diga em poucas palavras o que a organização faz."
              value={descricao}
              onChangeText={(valor) => {
                definirDescricao(valor);
                definirErros((atuais) => ({ ...atuais, descricao: null }));
              }}
              multiline
              maxLength={TAMANHO_MAXIMO_DESCRICAO}
              editable={!carregando}
            />
            <Text>
              {descricao.trim().length}/{TAMANHO_MAXIMO_DESCRICAO}
            </Text>
            {erros.descricao ? <Text>{erros.descricao}</Text> : null}
          </View>

          <Pressable accessibilityRole="button" onPress={enviar} disabled={carregando}>
            <Text>{carregando ? 'Enviando...' : 'Enviar solicitação'}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
