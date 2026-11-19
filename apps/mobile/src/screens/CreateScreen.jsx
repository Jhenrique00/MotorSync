import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Icon, IconButton, styles } from '../components/ui';
import { actions, actionDestination } from '../config/actions';
import { useCommercial } from '../hooks/useCommercial';
export default function CreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useAuth();
  const commercial = useCommercial('availability');
  const availableActions = actions.filter(
    (action) => action.ready || (action.requiresCommercial && commercial.ready),
  );
  const insets = useSafeAreaInsets();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar ações rápidas"
        onPress={close}
        style={{ flex: 1 }}
      />
      <View
        style={{
          maxHeight: '88%',
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          paddingBottom: Math.max(16, insets.bottom),
        }}
      >
        <View
          style={{
            width: 38,
            height: 5,
            borderRadius: 3,
            backgroundColor: colors.border,
            alignSelf: 'center',
            marginBottom: 12,
          }}
        />
        <View style={styles.row}>
          <Copy display size={28} weight="700">
            Criar
          </Copy>
          <IconButton name="close" label="Fechar" onPress={close} />
        </View>
        <Copy tone="muted" size={14}>
          Venda no Explorar ou organize seu estoque pessoal ou empresarial.
        </Copy>
        <ScrollView keyboardShouldPersistTaps="handled">
          {['Publicar', 'Anunciar', 'Gestão'].map((domain) => (
            <View key={domain} style={{ gap: 8, marginTop: 22 }}>
              <Copy size={11} tone="muted" weight="600" style={{ letterSpacing: 1 }}>
                {domain.toUpperCase()}
              </Copy>
              {availableActions
                .filter((action) => action.domain === domain)
                .map((action) => (
                  <Pressable
                    key={action.id}
                    accessibilityRole="button"
                    accessibilityLabel={action.title}
                    onPress={() =>
                      router.replace(
                        action.id === 'post' && session
                          ? { pathname: '/', params: { compose: String(Date.now()) } }
                          : actionDestination(action, Boolean(session)),
                      )
                    }
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        minHeight: 68,
                        padding: 12,
                        borderRadius: 18,
                        backgroundColor: colors.surface,
                        borderWidth: 0.75,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                      colors.lift,
                    ]}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.accentSoft,
                      }}
                    >
                      <Icon name={action.icon} color={colors.accentText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Copy weight="500">{action.title}</Copy>
                      <Copy size={12} tone="muted">
                        {domain === 'Publicar'
                          ? 'Compartilhe novidades com a comunidade'
                          : domain === 'Anunciar'
                            ? 'Anúncio no marketplace · empresa opcional'
                            : action.id === 'stock'
                              ? 'Estoque privado · pessoal ou empresarial'
                              : 'Clientes e propostas da sua gestão'}
                      </Copy>
                    </View>
                    <Icon name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
