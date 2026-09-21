/**
 * Tela de cadastro de organização — Incremento 1.
 *
 * Atende ao primeiro item do requisito "Cadastro de organização": o usuário
 * realiza o cadastro de uma nova organização. A autorização e a revogação são
 * do administrador do sistema e acontecem no backend, por isso esta tela nunca
 * envia o status: a organização sempre nasce pendente.
 *
 * Versão sem estilização: depois do envio, o formulário dá lugar à confirmação.
 */

import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AvisoFormulario } from '@/components/AvisoFormulario';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { CampoTexto } from '@/components/CampoTexto';
import { useCadastroOrganizacao } from '@/hooks/useCadastroOrganizacao';

export default function TelaCadastroOrganizacao() {
  const router = useRouter();

  const {
    nome,
    descricao,
    erros,
    aviso,
    carregando,
    enviada,
    caracteresUsados,
    limiteDeCaracteres,
    aoDigitarNome,
    aoDigitarDescricao,
    submeter,
  } = useCadastroOrganizacao();

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <BotaoPrimario titulo="Voltar" aoTocar={() => router.back()} />

      {enviada ? (
        <View>
          <Text>Solicitação enviada</Text>
          <Text>
            A organização {nome.trim()} foi cadastrada e aguarda a autorização de um
            administrador do sistema. Você será avisado assim que ela for analisada.
          </Text>
          <Text>Situação atual: aguardando autorização</Text>
          <BotaoPrimario titulo="Voltar ao início" aoTocar={() => router.back()} />
        </View>
      ) : (
        <View>
          <Text>Criar organização</Text>
          <Text>
            Informe os dados da organização. O cadastro passa pela autorização de um
            administrador do sistema antes de ficar disponível.
          </Text>

          {aviso ? <AvisoFormulario aviso={aviso} /> : null}

          <CampoTexto
            rotulo="Nome da organização"
            placeholder="Ex.: Conselho Municipal de Educação"
            value={nome}
            onChangeText={aoDigitarNome}
            erro={erros.nome}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            editable={!carregando}
          />

          <CampoTexto
            rotulo="Descrição (opcional)"
            placeholder="Diga em poucas palavras o que a organização faz."
            value={descricao}
            onChangeText={aoDigitarDescricao}
            erro={erros.descricao}
            multiline
            autoCapitalize="sentences"
            editable={!carregando}
          />
          <Text>
            {caracteresUsados}/{limiteDeCaracteres}
          </Text>

          <BotaoPrimario
            titulo="Enviar solicitação"
            aoTocar={submeter}
            carregando={carregando}
            tituloCarregando="Enviando..."
          />
        </View>
      )}
    </ScrollView>
  );
}
