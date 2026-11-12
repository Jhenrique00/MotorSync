import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, EmptyState, Button } from '../src/components/ui';
export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState
        title="Tela não encontrada"
        description="Este endereço não está disponível."
        action={<Button title="Ir para Home" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
