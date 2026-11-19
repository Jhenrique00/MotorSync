import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Copy, Icon } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { hairline } from '../theme/tokens';
const items = [
  ['index', 'Home', 'home-outline', 'home'],
  ['explore', 'Explorar', 'search-outline', 'search'],
  ['create', 'Criar', 'add', 'add'],
  ['management', 'Gestão', 'stats-chart-outline', 'stats-chart'],
  ['profile', 'Perfil', 'person-outline', 'person'],
];
export function BottomBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: hairline,
        borderColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
        flexDirection: 'row',
      }}
    >
      {items.map(([name, label, icon, iconFilled]) => {
        const selected = state.routes[state.index].name === name;
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={name === 'create' ? 'Abrir ações rápidas' : label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (name === 'create') {
                router.push('/create');
                return;
              }
              const route = state.routes.find((r) => r.name === name);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) navigation.navigate(name);
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 52,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View
              style={
                name === 'create'
                  ? {
                      width: 48,
                      height: 38,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accent,
                      shadowColor: colors.accent,
                      shadowOpacity: colors.lift.shadowOpacity ? 0.28 : 0,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                    }
                  : {
                      minWidth: 42,
                      minHeight: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }
              }
            >
              <Icon
                name={selected && name !== 'create' ? iconFilled : icon}
                size={name === 'create' ? 26 : 25}
                color={
                  name === 'create' ? colors.onAccent : selected ? colors.accentText : colors.muted
                }
              />
            </View>
            {name !== 'create' && (
              <Copy
                size={11}
                weight={selected ? '600' : '500'}
                tone={selected ? 'accentText' : 'muted'}
              >
                {label}
              </Copy>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
