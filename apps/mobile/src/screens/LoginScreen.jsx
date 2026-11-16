import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { signIn, signUp } from '../services/authService';
import { Brand, Copy } from '../components/ui';
import { FeedbackModal } from '../components/FeedbackModal';

const inputBase = {
  flex: 1,
  minHeight: 50,
  fontSize: 16,
  fontFamily: 'Inter_400Regular',
  paddingVertical: 12,
  paddingHorizontal: 12,
};
function CredentialField({
  name,
  icon,
  value,
  onChange,
  secure,
  keyboardType,
  autoComplete,
  error,
  colors,
  visible,
  setVisible,
  submit,
}) {
  return (
    <View style={{ gap: 5 }}>
      <Copy weight="500" size={13} tone="muted">
        {name}
      </Copy>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.elevated,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.fieldBorder,
          paddingLeft: 14,
        }}
      >
        <Ionicons name={icon} color={colors.muted} size={19} />
        <TextInput
          accessibilityLabel={name}
          placeholder={name === 'E-mail' ? 'seu@email.com' : 'Sua senha'}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          secureTextEntry={secure && !visible}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={name === 'Senha' ? submit : undefined}
          returnKeyType={name === 'Senha' ? 'go' : 'next'}
          style={[inputBase, { color: colors.text }]}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setVisible((state) => !state)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              minHeight: 48,
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              color={colors.muted}
              size={20}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Copy tone="danger" size={13}>
          {error}
        </Copy>
      ) : null}
    </View>
  );
}

export default function LoginScreen() {
  const { configured, error: connectionError } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const lock = useRef(false);

  async function submit() {
    if (lock.current || !configured) return;
    const invalid = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      invalid.email = 'Informe um e-mail válido.';
    if (!password || (register && password.length < 8))
      invalid.password = register ? 'Use pelo menos 8 caracteres.' : 'Informe sua senha.';
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await (register ? signUp(email, password) : signIn(email, password));
      if (register) {
        const existing =
          Array.isArray(result.user?.identities) && result.user.identities.length === 0;
        if (existing) {
          setFeedback({
            error: true,
            title: 'Confira seu e-mail',
            message: 'Este endereço pode já estar cadastrado. Entre ou recupere a senha.',
          });
          return;
        }
        setFeedback({
          success: true,
          title: 'Cadastro recebido',
          signedIn: Boolean(result.session),
          message: result.session
            ? 'Sua conta está conectada ao MotorSync.'
            : 'Confira seu e-mail para confirmar o cadastro antes de entrar.',
        });
      } else {
        setPassword('');
        router.replace('/profile');
      }
    } catch (failure) {
      setFeedback({
        error: true,
        title: register ? 'Cadastro não concluído' : 'Não foi possível entrar',
        message:
          failure?.status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : failure?.code === 'email_not_confirmed'
              ? 'Confirme seu e-mail antes de entrar.'
              : failure?.code === 'user_already_exists' || failure?.code === 'email_exists'
                ? 'Este e-mail já possui uma conta. Entre ou recupere sua senha.'
                : failure?.status === 400 || failure?.code === 'invalid_credentials'
                  ? 'E-mail ou senha incorretos.'
                  : 'Verifique sua conexão com a internet e tente novamente.',
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 36,
            maxWidth: 520,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <View style={{ alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <Brand />
            <View
              style={{
                marginTop: 10,
                width: 88,
                height: 88,
                borderRadius: 44,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentSoft,
                borderWidth: 0.75,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="person-outline" color={colors.accentText} size={44} />
            </View>
            <Copy display size={30} weight="700" style={{ textAlign: 'center' }}>
              {register ? 'Crie sua conta' : 'Bem-vindo ao MotorSync'}
            </Copy>
            <Copy tone="muted" size={14} style={{ textAlign: 'center' }}>
              {register
                ? 'Divulgue, negocie e gerencie seus veículos em um só lugar.'
                : 'Entre para acessar seu perfil, anúncios e gestão.'}
            </Copy>
          </View>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 22,
              borderColor: colors.border,
              borderWidth: 0.75,
              gap: 16,
              ...colors.lift,
            }}
          >
            {!configured && (
              <View
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: colors.accentSoft,
                  gap: 4,
                }}
              >
                <Copy weight="700" size={14}>
                  Conexão com Supabase não configurada
                </Copy>
                <Copy size={13}>
                  {connectionError ||
                    'Configure a URL e a chave publicável em apps/mobile/.env e reinicie o Expo.'}
                </Copy>
              </View>
            )}
            <CredentialField
              colors={colors}
              visible={visible}
              setVisible={setVisible}
              submit={submit}
              name="E-mail"
              icon="mail-outline"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />
            <CredentialField
              colors={colors}
              visible={visible}
              setVisible={setVisible}
              submit={submit}
              name="Senha"
              icon="lock-closed-outline"
              value={password}
              onChange={setPassword}
              secure
              autoComplete={register ? 'new-password' : 'current-password'}
              error={errors.password}
            />
            {!register && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/recover')}
                style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
              >
                <Copy tone="accentText" weight="600" size={14}>
                  Esqueci minha senha
                </Copy>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={register ? 'Criar conta' : 'Entrar'}
              accessibilityState={{ disabled: busy || !configured, busy }}
              disabled={busy || !configured}
              onPress={submit}
              style={({ pressed }) => ({
                backgroundColor: colors.accent,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                opacity: busy || !configured ? 0.5 : pressed ? 0.8 : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Copy tone="onAccent" weight="600">
                  {register ? 'Criar conta' : 'Entrar'}
                </Copy>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setRegister((state) => !state);
                setErrors({});
                setPassword('');
              }}
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Copy tone="accentText" weight="600" size={14}>
                {register ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}
              </Copy>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    </SafeAreaView>
  );
}
