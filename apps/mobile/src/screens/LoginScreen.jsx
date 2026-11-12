import React, { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { signIn, signUp } from '../services/authService';
import { Screen, Header, Brand, Field, Button, Notice, Card, Copy } from '../components/ui';
import { FeedbackModal } from '../components/FeedbackModal';
export default function LoginScreen() {
  const { configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [register, setRegister] = useState(false),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [errors, setErrors] = useState({}),
    [feedback, setFeedback] = useState(null);
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    const invalid = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      invalid.email = 'Informe um e-mail válido.';
    if (!password || (register && password.length < 8))
      invalid.password = register ? 'Use pelo menos 8 caracteres.' : 'Informe sua senha.';
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      if (register)
        setFeedback({
          error: true,
          title: 'Confira o cadastro',
          message: Object.values(invalid).join(' '),
        });
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const result = await (register ? signUp(email, password) : signIn(email, password));
      if (register) {
        // Supabase can mask existing accounts. Do not assert creation for an empty identity list.
        const existing =
          Array.isArray(result.user?.identities) && result.user.identities.length === 0;
        if (existing) {
          setFeedback({
            error: true,
            title: 'Confira seu e-mail',
            message:
              'Não foi possível confirmar um novo cadastro. Se já possui conta, entre ou recupere sua senha.',
          });
          return;
        }
        setFeedback({
          success: true,
          title: 'Conta criada',
          signedIn: Boolean(result.session),
          message: result.session
            ? 'Tudo pronto. Sua conta já está conectada ao MotorSync.'
            : 'Conta criada! Confirme seu e-mail para entrar.',
        });
      } else {
        setPassword('');
        router.replace('/profile');
      }
    } catch (e) {
      setFeedback({
        error: true,
        title: register ? 'Cadastro não concluído' : 'Não foi possível entrar',
        message:
          e.status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : e.code === 'email_not_confirmed'
              ? 'Confirme seu e-mail antes de entrar.'
              : e.code === 'user_already_exists' || e.code === 'email_exists'
                ? 'Este e-mail já possui uma conta. Entre ou recupere sua senha.'
                : e.status === 400
                  ? 'Confira seu e-mail e sua senha.'
                  : 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Header back title={register ? 'Criar conta' : 'Entrar'} kicker="SUA CONTA" />
      <Brand />
      <Copy tone="muted">
        {register
          ? 'Seu próximo negócio começa aqui. Anuncie como pessoa física ou com sua empresa.'
          : 'Entre para cuidar dos seus anúncios e continuar de onde parou.'}
      </Copy>
      {!configured ? (
        <Notice error>O serviço de acesso está indisponível. Tente mais tarde.</Notice>
      ) : (
        <Card style={{ gap: 16, padding: 20 }}>
          <Field
            label="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <Field
            label="Senha"
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoComplete={register ? 'new-password' : 'current-password'}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            onSubmitEditing={submit}
          />
          <Button
            title={visible ? 'Ocultar senha' : 'Mostrar senha'}
            variant="text"
            onPress={() => setVisible(!visible)}
          />
          <Button title={register ? 'Criar conta' : 'Entrar'} onPress={submit} loading={busy} />
          <Button
            title={register ? 'Já tenho uma conta' : 'Criar conta'}
            variant="text"
            disabled={busy}
            onPress={() => {
              setRegister(!register);
              setErrors({});
            }}
          />
          {!register && (
            <Button
              title="Esqueci minha senha"
              variant="text"
              onPress={() => router.push('/recover')}
            />
          )}
        </Card>
      )}
      <FeedbackModal
        value={feedback}
        onConfirm={() => {
          if (feedback?.success) {
            if (feedback.signedIn) {
              setPassword('');
              setFeedback(null);
              router.replace('/profile');
              return;
            }
            setRegister(false);
            setPassword('');
            setErrors({});
          }
          setFeedback(null);
        }}
      />
    </Screen>
  );
}
