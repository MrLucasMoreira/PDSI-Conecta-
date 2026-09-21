/**
 * Destino do login bem-sucedido.
 *
 * Versão sem estilização: mantém apenas a navegação para os fluxos do
 * Incremento 1 e a saída da conta. O acesso ao gerenciamento de organizações
 * continua restrito ao administrador do sistema.
 */

import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { removerToken } from '@/services/sessaoService';

export default function TelaInicio() {
  const router = useRouter();

  const { nome, organizacao, tipo } = useLocalSearchParams<{
    nome?: string;
    organizacao?: string;
    tipo?: string;
  }>();

  return (
    <ScrollView>
      <Text>Olá, {nome?.split(' ')[0] ?? 'bem-vindo'}!</Text>

      {organizacao ? <Text>Você entrou como membro de {organizacao}.</Text> : null}

      <View>
        <Text>Acesso liberado</Text>
        <Text>
          O login do Incremento 1 está concluído. As próximas telas — início, calendário,
          reuniões e histórico — entram nos incrementos seguintes.
        </Text>
      </View>

      {tipo === 'ADMIN_SISTEMA' ? (
        <BotaoPrimario
          titulo="Gerenciar organizações"
          aoTocar={() => router.push('/organizacao/aprovacao')}
        />
      ) : null}

      <BotaoPrimario
        titulo="Criar organização"
        aoTocar={() => router.push('/organizacao/cadastro')}
      />

      <BotaoPrimario
        titulo="Participar de uma organização"
        aoTocar={() => router.push('/organizacao/participar' as Href)}
      />

      <BotaoPrimario
        titulo="Membros da organização"
        aoTocar={() => router.push('/organizacao/membros' as Href)}
      />

      <BotaoPrimario titulo="Comissões" aoTocar={() => router.push('/comissoes')} />

      <BotaoPrimario titulo="Perfil" aoTocar={() => router.push('/perfil')} />

      <BotaoPrimario titulo="Alterar senha" aoTocar={() => router.push('/alterar-senha')} />

      <BotaoPrimario
        titulo="Sair"
        aoTocar={() => {
          void removerToken().then(() => router.replace('/login'));
        }}
      />
    </ScrollView>
  );
}
