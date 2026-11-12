import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Copy, Icon } from './ui';
import { useTheme } from '../contexts/ThemeContext';
const items = [
  ['index', 'Home', 'home-outline'],
  ['explore', 'Explorar', 'search-outline'],
  ['create', 'Criar', 'add'],
  ['management', 'Gestão', 'stats-chart-outline'],
  ['profile', 'Perfil', 'person-outline'],
];
export function BottomBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        flexDirection: 'row',
      }}
    >
      {items.map(([name, label, icon]) => {
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
            style={{
              flex: 1,
              minHeight: 52,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <View
              style={
                name === 'create'
                  ? {
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accent,
                    }
                  : {
                      minWidth: 42,
                      minHeight: 30,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.accentSoft : 'transparent',
                    }
              }
            >
              <Icon
                name={icon}
                size={24}
                color={
                  name === 'create' ? colors.onAccent : selected ? colors.accentText : colors.muted
                }
              />
            </View>
            {name !== 'create' && (
              <Copy
                size={12}
                weight={selected ? '700' : '500'}
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
