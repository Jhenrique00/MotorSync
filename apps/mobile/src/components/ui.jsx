import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { space, radius, type, hairline } from '../theme/tokens';
import { families, familyFor, refineWeight, trackingFor, leadingFor } from '../theme/fonts';
export { Brand } from './Brand';
const numeric = /^[\d\s.,:%+\-–R$]+$/;
// `display` selects Playfair Display (titles/editorial highlights only). Everything else is Inter.
export function Copy({
  children,
  tone = 'text',
  size = type.body,
  weight = '400',
  display = false,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const figures =
    !display &&
    (typeof children === 'number' || (typeof children === 'string' && numeric.test(children)));
  return (
    <Text
      {...rest}
      style={[
        {
          color: colors[tone] || tone,
          fontSize: size,
          fontFamily: familyFor(display ? weight : refineWeight(weight, size), display),
          lineHeight: Math.round(size * leadingFor(size, display)),
          letterSpacing: trackingFor(size, display),
          includeFontPadding: false,
          ...(figures ? { fontVariant: ['tabular-nums'] } : null),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({ name, size = 22, color }) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color || colors.text} />;
}
export function IconButton({ name, label, onPress, selected, color, style }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          minWidth: 48,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.55 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} size={23} color={color || (selected ? colors.accentText : colors.text)} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  const plain = variant === 'text';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: plain ? 48 : 52,
          borderRadius: radius.sm + 2,
          paddingVertical: space.md,
          paddingHorizontal: plain ? space.md : space.lg,
          borderWidth: primary || plain ? 0 : hairline,
          borderColor: colors.border,
          backgroundColor: primary ? colors.accent : plain ? 'transparent' : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: space.sm,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        !primary && !plain ? colors.lift : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.onAccent : colors.text} />
      ) : icon ? (
        <Icon name={icon} size={20} color={primary ? colors.onAccent : colors.accentText} />
      ) : null}
      <Copy
        weight="500"
        tone={primary ? 'onAccent' : plain ? 'accentText' : 'text'}
        style={{ textAlign: 'center', flexShrink: 1, includeFontPadding: false }}
      >
        {title}
      </Copy>
    </Pressable>
  );
}
export function Card({ children, style }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: space.lg,
          borderWidth: hairline,
          borderColor: colors.border,
          gap: space.sm,
        },
        colors.lift,
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Screen({ children, scroll = true, style }) {
  const { colors } = useTheme();
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.page, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, style]}>{children}</View>
  );
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Header({ title, subtitle, kicker, back = false, right }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.xs, marginBottom: space.sm }}>
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={8}
          style={({ pressed }) => ({
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            alignSelf: 'flex-start',
            marginLeft: -6,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Icon name="chevron-back" size={24} color={colors.accentText} />
          <Copy tone="accentText">Voltar</Copy>
        </Pressable>
      )}
      {kicker && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: colors.accent }} />
          <Copy tone="accentText" size={11} weight="600" style={{ letterSpacing: 1.6 }}>
            {kicker}
          </Copy>
        </View>
      )}
      <View style={styles.row}>
        <Copy accessibilityRole="header" display size={34} weight="700" style={{ flex: 1 }}>
          {title}
        </Copy>
        {right}
      </View>
      {subtitle && <Copy tone="muted">{subtitle}</Copy>}
    </View>
  );
}
export function Section({ title, children }) {
  return (
    <View style={{ gap: space.md, marginTop: space.lg }}>
      <Copy accessibilityRole="header" display size={22} weight="600">
        {title}
      </Copy>
      {children}
    </View>
  );
}
export function Notice({ children, error = false }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.sm,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        borderRadius: radius.sm + 2,
        backgroundColor: error ? colors.surface : colors.accentSoft,
        borderWidth: error ? 1 : 0,
        borderColor: colors.danger,
      }}
    >
      <Icon
        name={error ? 'alert-circle' : 'information-circle'}
        size={18}
        color={error ? colors.danger : colors.accentText}
      />
      <Copy size={type.caption} tone={error ? 'danger' : 'accentText'} style={{ flex: 1 }}>
        {children}
      </Copy>
    </View>
  );
}
export const DemoNotice = () => (
  <Notice>
    Demonstração · dados fictícios. Interações nesta sessão não são enviadas a um servidor.
  </Notice>
);
export function EmptyState({ title, description, icon = 'albums-outline', action }) {
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentSoft,
        }}
      >
        <Icon name={icon} size={28} color={colors.accentText} />
      </View>
      <Copy display weight="600" size={20} style={{ textAlign: 'center' }}>
        {title}
      </Copy>
      <Copy tone="muted" size={14} style={{ textAlign: 'center' }}>
        {description}
      </Copy>
      {action}
    </Card>
  );
}
export function Field({ label, error, style, hideLabel = false, icon, ...props }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs + 2 }}>
      {!hideLabel && (
        <Copy size={13} weight="500" tone="muted">
          {label}
        </Copy>
      )}
      <View style={{ justifyContent: 'center' }}>
        {icon && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: space.md + 2, zIndex: 1 }}
          >
            <Icon name={icon} size={18} color={colors.muted} />
          </View>
        )}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accentText}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            {
              minHeight: 50,
              paddingVertical: space.md,
              paddingRight: space.lg,
              paddingLeft: icon ? space.md + 2 + 18 + space.sm : space.lg,
              borderRadius: radius.sm + 2,
              borderWidth: 1,
              borderColor: error ? colors.danger : focused ? colors.accent : colors.fieldBorder,
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: type.body,
              fontFamily: families.body,
            },
            style,
          ]}
        />
      </View>
      {error && (
        <Copy tone="danger" size={type.caption}>
          {error}
        </Copy>
      )}
    </View>
  );
}
export function Chip({ title, selected, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: space.lg + 2,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        borderWidth: selected ? 1 : hairline,
        borderColor: selected ? colors.accentText : colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Copy size={14} weight={selected ? '600' : '500'} tone={selected ? 'accentText' : 'text'}>
        {title}
      </Copy>
    </Pressable>
  );
}
export function Media({ uri, label, style, onRetry }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [uri]);
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.elevated, overflow: 'hidden' }, style]}>
      {!failed && uri ? (
        <Image
          key={`${uri}-${attempt}`}
          source={{ uri }}
          accessibilityLabel={label}
          resizeMode="cover"
          style={StyleSheet.absoluteFillObject}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
      {failed || !uri ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
          ]}
        >
          <Icon name="image-outline" size={32} color={colors.muted} />
          <Copy tone="muted" size={13}>
            {uri ? 'Não foi possível carregar a foto' : 'Ainda sem fotos'}
          </Copy>
          {uri && (
            <Button
              title="Tentar novamente"
              variant="secondary"
              onPress={() => {
                setFailed(false);
                setLoaded(false);
                setAttempt((n) => n + 1);
                onRetry?.();
              }}
            />
          )}
        </View>
      ) : !loaded ? (
        <ActivityIndicator style={StyleSheet.absoluteFillObject} color={colors.accent} />
      ) : null}
    </View>
  );
}
export function RowLink({ title, subtitle, icon = 'chevron-forward', onPress, selected }) {
  const { colors } = useTheme();
  const leading = icon !== 'chevron-forward';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={selected === undefined ? undefined : { selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          minHeight: 64,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderRadius: radius.md,
          borderWidth: hairline,
          borderColor: selected ? colors.accentText : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
        colors.lift,
      ]}
    >
      {leading && (
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accentSoft,
          }}
        >
          <Icon name={icon} size={20} color={colors.accentText} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Copy weight="500">{title}</Copy>
        {subtitle && (
          <Copy size={type.caption} tone="muted">
            {subtitle}
          </Copy>
        )}
      </View>
      <Icon
        name={selected ? 'checkmark' : 'chevron-forward'}
        size={selected ? 20 : 16}
        color={selected ? colors.accentText : colors.muted}
      />
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: space.lg,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
