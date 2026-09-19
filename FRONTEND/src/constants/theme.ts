/**
 * Identidade visual do Conecta+.
 *
 * Os valores abaixo sao os definidos no documento de Identidade Visual da
 * proposta inicial (PropostaInicial/Topico3.pdf) e devem ser usados em todas as
 * telas para manter o padrao visual exigido nos requisitos nao funcionais.
 */

export const CORES = {
  // Paleta oficial da marca.
  INDIGO: '#1e2080',
  VIOLETA: '#544cee',
  AZUL: '#256ef1',
  ROXO: '#5e46e8',
  ELETRICO: '#1a3ff9',
  GRAFITE: '#363ac5',
  MAGENTA: '#8436dd',
  BRANCO: '#ffffff',
  PRETO: '#000000',

  // Tons de apoio derivados da marca, usados em texto e superficies.
  TEXTO_FORTE: '#141a3a',
  TEXTO_MEDIO: '#4b5375',
  TEXTO_FRACO: '#8a90ad',
  FUNDO: '#f5f6fc',
  CARTAO: '#ffffff',
  CAMPO: '#f2f3fb',
  BORDA: '#e2e5f2',

  // Cores de estado usadas em validacao e feedback.
  ERRO: '#d92d42',
  ALERTA: '#b25e00',
  SUCESSO: '#0f8a5f',
} as const;

/** Gradiente principal da marca, extraido do logotipo (azul -> magenta). */
export const GRADIENTE_MARCA = [CORES.AZUL, CORES.VIOLETA, CORES.MAGENTA] as const;

/** Gradiente de apoio usado no plano de fundo das telas de autenticacao. */
export const GRADIENTE_FUNDO = ['#eef1fd', '#f7f5fe', CORES.FUNDO] as const;

/** Familia tipografica oficial (Poppins). */
export const FONTES = {
  REGULAR: 'Poppins_400Regular',
  MEDIUM: 'Poppins_500Medium',
  SEMIBOLD: 'Poppins_600SemiBold',
  BOLD: 'Poppins_700Bold',
} as const;

/** Assinatura da marca apresentada no logotipo. */
export const ASSINATURA_MARCA = 'Reúnas. Organize. Conecte.';
