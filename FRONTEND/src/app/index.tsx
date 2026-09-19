/** Rota inicial: encaminha para a tela de login. */

import { Redirect } from 'expo-router';

export default function Raiz() {
  return <Redirect href="/login" />;
}
