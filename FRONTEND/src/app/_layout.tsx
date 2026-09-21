/**
 * Layout raiz do aplicativo.
 *
 * Versão sem estilização: apenas a pilha de navegação do Expo Router.
 */

import { Stack } from 'expo-router';

export default function LayoutRaiz() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
