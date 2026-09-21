/** Tela de início: reúne os atalhos dos fluxos do aplicativo e a saída da conta. */

import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { removerToken } from '@/services/api';

const ATALHOS: { titulo: string; destino: Href }[] = [
  { titulo: 'Criar organização', destino: '/organizacao-cadastro' },
  { titulo: 'Participar de uma organização', destino: '/organizacao-participar' },
  { titulo: 'Membros da organização', destino: '/organizacao-membros' },
  { titulo: 'Comissões', destino: '/comissoes' },
  { titulo: 'Perfil', destino: '/perfil' },
  { titulo: 'Alterar senha', destino: '/alterar-senha' },
];

export default function TelaInicio() {
  const router = useRouter();
  const { nome, organizacao, tipo } = useLocalSearchParams<{
    nome?: string;
    organizacao?: string;
    tipo?: string;
  }>();

  async function sair() {
    await removerToken();
    router.replace('/login');
  }

  return (
    <ScrollView>
      <Text>Olá, {nome?.split(' ')[0] ?? 'bem-vindo'}!</Text>

      {organizacao ? <Text>Você entrou como membro de {organizacao}.</Text> : null}

      <View>
        {tipo === 'ADMIN_SISTEMA' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/organizacao-aprovacao')}
          >
            <Text>Gerenciar organizações</Text>
          </Pressable>
        ) : null}

        {ATALHOS.map((atalho) => (
          <Pressable
            key={atalho.titulo}
            accessibilityRole="button"
            onPress={() => router.push(atalho.destino)}
          >
            <Text>{atalho.titulo}</Text>
          </Pressable>
        ))}

        <Pressable accessibilityRole="button" onPress={sair}>
          <Text>Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
