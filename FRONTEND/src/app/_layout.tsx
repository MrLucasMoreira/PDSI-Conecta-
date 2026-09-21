/** Pilha de navegação do aplicativo, fontes da marca e tema. */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';

import { TemaProvider, useTema } from '@/contexts/TemaContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function LayoutRaiz() {
  const [carregadas, erro] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (carregadas || erro) void SplashScreen.hideAsync();
  }, [carregadas, erro]);

  if (!carregadas && !erro) return null;

  return (
    <TemaProvider>
      <Navegacao />
    </TemaProvider>
  );
}

function Navegacao() {
  const { tema } = useTema();

  return (
    <>
      <StatusBar style={tema.escuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.cores.fundo } }}
      />
    </>
  );
}
