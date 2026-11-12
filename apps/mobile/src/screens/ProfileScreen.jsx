import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { signOut } from '../services/authService';
import { supabase } from '../services/supabase';
import { createAccountApi } from '../services/accountApi';
import {
  Screen,
  Header,
  Card,
  Copy,
  Section,
  Chip,
  RowLink,
  Notice,
  Button,
  Icon,
  styles,
} from '../components/ui';
const api = createAccountApi(supabase);
export default function ProfileScreen() {
  const { colors, preference, changeTheme, storageError } = useTheme();
  const { session, configured, error, loading } = useAuth();
  const { state, dispatch } = useDemo();
  const router = useRouter();
  const focused = useIsFocused();
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileRetry, setProfileRetry] = useState(0);
  const name = session?.user.id && profile?.userId === session.user.id ? profile.name : '';
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setProfile(null);
    setProfileError('');
    if (session?.user.id && focused)
      api
        .load()
        .then((r) => {
          if (active) setProfile({ userId: session.user.id, name: r.profile?.display_name || '' });
        })
        .catch(() => {
          if (active) setProfileError('Não foi possível carregar seu perfil. Verifique a conexão.');
        });
    return () => {
      active = false;
    };
  }, [session?.user.id, focused, profileRetry]);
  async function leave() {
    setBusy(true);
    try {
      await signOut();
      setMessage('Sessão encerrada.');
    } catch {
      setMessage('Não foi possível encerrar a sessão. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Header title="Perfil" kicker="SEU ESPAÇO" />
      <View
        style={{ gap: 16, paddingBottom: 24, borderBottomWidth: 1, borderColor: colors.border }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {name ? (
            <Copy size={26} tone="accentText" weight="700">
              {name.trim().slice(0, 1).toLocaleUpperCase('pt-BR')}
            </Copy>
          ) : (
            <Icon name="person-outline" size={28} color={colors.accentText} />
          )}
        </View>
        <Copy weight="700" size={26}>
          {name || (session ? 'Sua conta' : 'Bem-vindo ao MotorSync')}
        </Copy>
        <Copy tone="muted" size={14}>
          {session?.user.email || 'Encontre, anuncie e acompanhe tudo em um só lugar.'}
        </Copy>
        {!session && (
          <Button
            title={configured ? 'Entrar na conta' : 'Sobre a conexão da conta'}
            loading={loading}
            onPress={() => router.push('/login')}
          />
        )}
        {session && (
          <Button
            title="Editar perfil e consultar empresas"
            variant="secondary"
            icon="person-circle-outline"
            onPress={() => router.push('/account')}
          />
        )}
      </View>
      <>
        {profileError && session && (
          <>
            <Notice error>{profileError}</Notice>
            <Button
              title="Recarregar perfil"
              variant="secondary"
              onPress={() => setProfileRetry((n) => n + 1)}
            />
          </>
        )}
      </>
      <Section title="Sua atividade">
        <RowLink
          title="Minhas propostas"
          subtitle="Acompanhe suas ofertas para empresas"
          icon="document-text-outline"
          onPress={() => router.push('/management/mine')}
        />
        <RowLink
          title="Meus anúncios"
          subtitle="Rascunhos, publicados e arquivados"
          icon="pricetag-outline"
          onPress={() => router.push('/my-listings')}
        />
        <RowLink
          title="Favoritos e publicações salvas"
          subtitle={`${state.favorites.length} anúncios · ${state.saved.length} publicações`}
          icon="bookmark-outline"
          onPress={() => router.push('/saved')}
        />
      </Section>
      <Section title="Aparência">
        <Copy size={14} tone="muted">
          Escolha seu tema ou acompanhe o dispositivo.
        </Copy>
        <View style={styles.wrap}>
          {[
            ['system', 'Automático'],
            ['light', 'Claro'],
            ['dark', 'Escuro'],
          ].map(([value, label]) => (
            <Chip
              key={value}
              title={label}
              selected={preference === value}
              onPress={() => changeTheme(value)}
            />
          ))}
        </View>
        {storageError && <Notice error>{storageError}</Notice>}
      </Section>
      <Section title="Conta e segurança">
        {error && <Notice error>{error}</Notice>}
        <RowLink
          title="Segurança e senha"
          icon="lock-closed-outline"
          onPress={() => router.push('/recover')}
        />
        <Copy tone="muted" size={14}>
          Empresa é opcional. Você pode anunciar com sua conta pessoal.
        </Copy>
        {session && (
          <Button title="Sair da conta" loading={busy} variant="secondary" onPress={leave} />
        )}
      </Section>
      <Section title="Sobre esta versão">
        <Copy size={13} tone="muted">
          O feed e suas interações sociais são exemplos locais. Curtidas, comentários e favoritos
          ficam nesta sessão. Conta, anúncios e estoque usam o servidor. O fluxo comercial depende
          da atualização autorizada do banco; o Financeiro permanece pendente.
        </Copy>
        {confirmReset ? (
          <Card>
            <Copy>Limpar curtidas, comentários e favoritos desta sessão?</Copy>
            <Button
              title="Confirmar limpeza"
              onPress={() => {
                dispatch({ type: 'reset' });
                setConfirmReset(false);
                setMessage('Demonstração restaurada.');
              }}
            />
            <Button title="Cancelar" variant="secondary" onPress={() => setConfirmReset(false)} />
          </Card>
        ) : (
          <Button
            title="Restaurar demonstração"
            variant="text"
            onPress={() => setConfirmReset(true)}
          />
        )}
      </Section>
      {message && <Notice>{message}</Notice>}
      <Copy size={13} tone="muted">
        MotorSync · Versão acadêmica
      </Copy>
    </Screen>
  );
}
