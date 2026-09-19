/**
 * Layout raiz do aplicativo.
 *
 * Carrega a tipografia oficial (Poppins) antes de exibir qualquer tela e define
 * a navegação em pilha usada pelas telas de autenticação.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';

import { TemaProvider, useTema } from '@/contexts/TemaContext';

SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const [fontesCarregadas, erroNasFontes] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontesCarregadas || erroNasFontes) {
      SplashScreen.hideAsync();
    }
  }, [fontesCarregadas, erroNasFontes]);

  if (!fontesCarregadas && !erroNasFontes) {
    return null;
  }

  return (
    <TemaProvider>
      <ConteudoRaiz />
    </TemaProvider>
  );
}

function ConteudoRaiz() {
  const { cores, temaEfetivo } = useTema();

  return (
    <>
      <StatusBar style={temaEfetivo === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </>
  );
}
