import { useState } from 'react';
import { View } from 'react-native';
import { CampoTexto } from './CampoTexto';
import { BotaoPrimario } from './BotaoPrimario';

export function FormularioComissao({
  nomeInicial = '',
  descricaoInicial = '',
  salvar,
  carregando,
  desabilitado = false,
  titulo = 'Salvar comissão',
}: {
  nomeInicial?: string;
  descricaoInicial?: string;
  salvar: (nome: string, descricao: string) => void;
  carregando: boolean;
  desabilitado?: boolean;
  titulo?: string;
}) {
  const [nome, definirNome] = useState(nomeInicial);
  const [descricao, definirDescricao] = useState(descricaoInicial);
  const [erro, definirErro] = useState<string | null>(null);
  function enviar() {
    if (nome.trim().length < 2) {
      definirErro('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    definirErro(null);
    salvar(nome.trim(), descricao.trim());
  }
  return (
    <View>
      <CampoTexto
        rotulo="Nome da comissão *"
        value={nome}
        onChangeText={(valor) => {
          definirNome(valor);
          definirErro(null);
        }}
        maxLength={100}
        erro={erro}
        editable={!carregando && !desabilitado}
        placeholder="Ex.: Comissão de eventos"
      />
      <CampoTexto
        rotulo="Descrição (opcional)"
        value={descricao}
        onChangeText={definirDescricao}
        maxLength={1000}
        multiline
        editable={!carregando && !desabilitado}
        placeholder="Descreva o objetivo da comissão"
      />
      <BotaoPrimario
        titulo={titulo}
        aoTocar={enviar}
        carregando={carregando}
        desabilitado={desabilitado}
        tituloCarregando="Salvando..."
      />
    </View>
  );
}
