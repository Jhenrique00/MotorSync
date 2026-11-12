import React, { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '../src/services/supabase';
import { Screen, Header, Field, Button, Notice, Copy } from '../src/components/ui';
import { FeedbackModal } from '../src/components/FeedbackModal';
export default function Recover() {
  const router = useRouter();
  const url = Linking.useURL();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [recovery, setRecovery] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [feedback, setFeedback] = useState(null);
  const lock = useRef(false);
  useEffect(() => {
    if (!url || !supabase) return;
    const hash = new URLSearchParams(url.split('#')[1] || '');
    if (hash.get('type') !== 'recovery') return;
    let active = true;
    supabase.auth
      .setSession({
        access_token: hash.get('access_token') || '',
        refresh_token: hash.get('refresh_token') || '',
      })
      .then(({ error }) => {
        if (active) {
          setRecovery(!error);
          if (error) setError('O link expirou. Solicite outro e-mail.');
        }
      });
    return () => {
      active = false;
    };
  }, [url]);
  async function submit() {
    if (lock.current) return;
    setError('');
    if (recovery ? password.length < 8 : !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(recovery ? 'Use pelo menos 8 caracteres.' : 'Informe um e-mail válido.');
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      if (!supabase) throw new Error();
      const { error } = recovery
        ? await supabase.auth.updateUser({ password })
        : await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: Linking.createURL('/recover'),
          });
      if (error) throw error;
      if (recovery) {
        await supabase.auth.signOut({ scope: 'local' });
        setPassword('');
      }
      setFeedback({
        title: recovery ? 'Senha atualizada' : 'Confira seu e-mail',
        message: recovery
          ? 'Entre novamente com sua nova senha.'
          : 'Se houver uma conta com este e-mail, você receberá um link para redefinir a senha.',
        done: recovery,
      });
    } catch {
      setError('Não foi possível concluir. Confira a conexão e tente novamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Header back title={recovery ? 'Nova senha' : 'Recuperar senha'} />
      {recovery ? (
        <Field label="Nova senha" secureTextEntry value={password} onChangeText={setPassword} />
      ) : (
        <>
          <Copy>Enviaremos um link para você definir uma nova senha.</Copy>
          <Field
            label="E-mail"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </>
      )}
      {error && <Notice error>{error}</Notice>}
      <Button
        title={recovery ? 'Salvar nova senha' : 'Enviar link'}
        loading={busy}
        onPress={submit}
      />
      <FeedbackModal
        value={feedback}
        onConfirm={() => {
          const done = feedback?.done;
          setFeedback(null);
          if (done) router.replace('/login');
        }}
      />
    </Screen>
  );
}
