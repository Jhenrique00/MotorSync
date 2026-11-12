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
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: Math.max(16, insets.bottom),
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.fieldBorder,
            alignSelf: 'center',
            marginBottom: 12,
          }}
        />
        <View style={styles.row}>
          <Copy size={22} weight="700">
            Criar
          </Copy>
          <IconButton name="close" label="Fechar" onPress={close} />
        </View>
        <Copy tone="muted" size={14}>
          Venda no Explorar ou organize seu estoque pessoal ou empresarial.
        </Copy>
        <ScrollView keyboardShouldPersistTaps="handled">
          {['Anunciar', 'Gestão'].map((domain) => (
            <View key={domain} style={{ gap: 8, marginTop: 20 }}>
              <Copy size={12} tone="muted" weight="700">
                {domain.toUpperCase()}
              </Copy>
              {availableActions
                .filter((action) => action.domain === domain)
                .map((action) => (
                  <Pressable
                    key={action.id}
                    accessibilityRole="button"
                    accessibilityLabel={action.title}
                    onPress={() => router.replace(actionDestination(action, Boolean(session)))}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      minHeight: 64,
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.accentSoft,
                      }}
                    >
                      <Icon name={action.icon} color={colors.accentText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Copy weight="600">{action.title}</Copy>
                      <Copy size={12} tone="muted">
                        {domain === 'Anunciar'
                          ? 'Anúncio no marketplace · empresa opcional'
                          : action.id === 'stock'
                            ? 'Estoque privado · pessoal ou empresarial'
                            : 'Clientes e propostas da sua gestão'}
                      </Copy>
                    </View>
                    <Icon name="chevron-forward" size={18} />
                  </Pressable>
                ))}
            </View>
          ))}
          <View style={{ marginTop: 20, gap: 6 }}>
            <Copy weight="600">Publicações na Home</Copy>
            <Copy size={13} tone="muted">
              A criação de publicações sociais ainda não está disponível.
              {!commercial.ready && ' Clientes e propostas aguardam a ativação do serviço.'}
            </Copy>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
