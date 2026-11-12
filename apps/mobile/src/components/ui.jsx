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
import { space, radius, type, typography } from '../theme/tokens';
export { Brand } from './Brand';
export function Copy({
  children,
  tone = 'text',
  size = type.body,
  weight = '400',
  style,
  ...rest
}) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          color: colors[tone] || tone,
          fontSize: size,
          fontWeight: weight,
          lineHeight: size * 1.4,
          fontFamily: typography.fontFamily,
          letterSpacing: typography.letterSpacing,
          includeFontPadding: false,
          fontVariant: ['tabular-nums'],
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
      style={({ pressed }) => [
        {
          minWidth: 48,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.65 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} color={color || (selected ? colors.accentText : colors.text)} />
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 50,
          borderRadius: radius.sm,
          padding: space.md,
          borderWidth: variant === 'text' ? 0 : 1,
          borderColor: primary ? colors.accentText : colors.fieldBorder,
          backgroundColor: primary
            ? colors.accent
            : variant === 'text'
              ? 'transparent'
              : colors.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: space.sm,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.onAccent : colors.text} />
      ) : icon ? (
        <Icon name={icon} color={primary ? colors.onAccent : colors.text} />
      ) : null}
      <Copy
        weight="700"
        tone={primary ? 'onAccent' : 'text'}
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
          borderWidth: 1,
          borderColor: colors.border,
          gap: space.sm,
        },
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
  return (
    <View style={{ gap: space.xs, marginBottom: space.sm }}>
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
          }}
        >
          <Icon name="arrow-back" />
          <Copy>Voltar</Copy>
        </Pressable>
      )}
      {kicker && (
        <Copy tone="accentText" size={type.caption} weight="700" style={{ letterSpacing: 1.5 }}>
          {kicker}
        </Copy>
      )}
      <View style={styles.row}>
        <Copy
          accessibilityRole="header"
          size={type.title}
          weight="700"
          style={{ flex: 1, letterSpacing: -0.7 }}
        >
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
    <View style={{ gap: space.md, marginTop: space.md }}>
      <Copy accessibilityRole="header" size={type.subtitle} weight="700">
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
        padding: space.md,
        borderRadius: radius.sm,
        backgroundColor: error ? colors.surface : colors.accentSoft,
        borderWidth: error ? 1 : 0,
        borderColor: colors.danger,
      }}
    >
      <Copy size={type.caption} tone={error ? 'danger' : 'accentText'}>
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
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
      <Icon name={icon} size={32} />
      <Copy weight="700" style={{ textAlign: 'center' }}>
        {title}
      </Copy>
      <Copy tone="muted" style={{ textAlign: 'center' }}>
        {description}
      </Copy>
      {action}
    </Card>
  );
}
export function Field({ label, error, style, ...props }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.sm }}>
      <Copy size={14} weight="600">
        {label}
      </Copy>
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
            minHeight: 52,
            padding: space.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: error ? colors.danger : focused ? colors.accentText : colors.fieldBorder,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: type.body,
          },
          style,
        ]}
      />
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
      style={{
        minHeight: 44,
        paddingHorizontal: space.lg,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.accentText : colors.fieldBorder,
      }}
    >
      <Copy size={14} weight="600" tone={selected ? 'accentText' : 'text'}>
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
          <Icon name="image-outline" size={32} />
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={selected === undefined ? undefined : { selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.lg,
        minHeight: 68,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} />
      <View style={{ flex: 1, gap: 4 }}>
        <Copy weight="600">{title}</Copy>
        {subtitle && (
          <Copy size={type.caption} tone="muted">
            {subtitle}
          </Copy>
        )}
      </View>
      <Icon name={selected ? 'checkmark' : 'chevron-forward'} size={18} />
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  page: {
    padding: 20,
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
