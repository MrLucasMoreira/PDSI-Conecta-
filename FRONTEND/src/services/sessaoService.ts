import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE_TOKEN = 'conecta_mais_token';

function obterArmazenamentoWeb() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

async function salvarItem(chave: string, valor: string) {
  if (Platform.OS === 'web') {
    obterArmazenamentoWeb()?.setItem(chave, valor);
    return;
  }

  await SecureStore.setItemAsync(chave, valor);
}

async function obterItem(chave: string) {
  if (Platform.OS === 'web') {
    return obterArmazenamentoWeb()?.getItem(chave) ?? null;
  }

  return SecureStore.getItemAsync(chave);
}

async function removerItem(chave: string) {
  if (Platform.OS === 'web') {
    obterArmazenamentoWeb()?.removeItem(chave);
    return;
  }

  await SecureStore.deleteItemAsync(chave);
}

export async function salvarToken(token: string) {
  await salvarItem(CHAVE_TOKEN, token);
}

export async function obterToken() {
  return obterItem(CHAVE_TOKEN);
}

export async function removerToken() {
  await removerItem(CHAVE_TOKEN);
}
