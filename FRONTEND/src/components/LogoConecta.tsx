/**
 * Logotipo do Conecta+.
 *
 * A imagem é a versão oficial definida no documento de Identidade Visual
 * (PropostaInicial/Topico3.pdf).
 */

import { Image, View } from 'react-native';

import { ASSINATURA_MARCA } from '@/constants/theme';

type LogoConectaProps = {
  /** `completo` mostra símbolo, marca e assinatura; `simbolo` mostra apenas o ícone. */
  variante?: 'completo' | 'simbolo';
  /** Largura da imagem em pixels independentes de densidade. */
  largura?: number;
};

const PROPORCAO = {
  completo: 353 / 375,
  simbolo: 252 / 236,
} as const;

export function LogoConecta({ variante = 'completo', largura = 210 }: LogoConectaProps) {
  const origem =
    variante === 'completo'
      ? require('@/assets/images/logo-conecta-mais.png')
      : require('@/assets/images/icone-conecta-mais.png');

  const descricao =
    variante === 'completo' ? `Conecta+. ${ASSINATURA_MARCA}` : 'Conecta+';

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao}>
      <Image
        source={origem}
        style={{ width: largura, height: largura * PROPORCAO[variante] }}
        resizeMode="contain"
      />
    </View>
  );
}
