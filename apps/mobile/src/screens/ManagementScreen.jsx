import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Copy, Button, Notice, Icon } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';
import { useCommercial } from '../hooks/useCommercial';
import { radius, space, type } from '../theme/tokens';
import { moneyWithCents } from '../utils/catalog';

const mainAccesses = [
  {
    title: 'Estoque',
    subtitle: 'Veículos e anúncios',
    icon: 'car-outline',
    route: '/management/inventory',
  },
  {
    title: 'Clientes',
    subtitle: 'Contatos e histórico',
    icon: 'people-outline',
    route: '/management/clients',
  },
  {
    title: 'Propostas',
    subtitle: 'Negociações e acompanhamento',
    icon: 'document-text-outline',
    route: '/management/proposals',
  },
];

function SummaryMetric({ label, value, colors }) {
  return (
    <View style={[styles.summaryMetric, { backgroundColor: colors.heroSoft }]}>
      <Copy size={type.subtitle} weight="600" tone="onMedia" numberOfLines={1}>
        {value}
      </Copy>
      <Copy tone="mediaMuted" size={type.caption}>
        {label}
      </Copy>
    </View>
  );
}

function Overview({ remote, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Visão geral: resultados e vendas"
      accessibilityHint="Abre o Financeiro para consultar resultados e registrar vendas"
      onPress={onPress}
      style={({ pressed }) => [
        styles.overview,
        colors.lift,
        {
          backgroundColor: colors.hero,
          borderColor: colors.heroBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.overviewAccent, { backgroundColor: colors.accent }]} />
      <View style={styles.overviewContent}>
        <View style={styles.overviewHeading}>
          <View style={[styles.overviewIcon, { backgroundColor: colors.heroSoft }]}>
            <Icon name="stats-chart-outline" size={23} color={colors.mediaAccent} />
          </View>
          <View style={styles.flexContent}>
            <Copy display size={22} weight="600" tone="onMedia">
              Visão geral
            </Copy>
            <Copy tone="mediaMuted" size={type.caption}>
              Resumo da sua operação
            </Copy>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.mediaAccent} />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.heroBorder }]} />

        {remote.loading ? (
          <Copy tone="mediaMuted">Carregando resultados…</Copy>
        ) : remote.ready ? (
          <View style={styles.results}>
            <Copy tone="mediaMuted" size={11} weight="600" style={{ letterSpacing: 1.4 }}>
              VALOR VENDIDO
            </Copy>
            <Copy
              size={36}
              weight="700"
              tone="onMedia"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              style={styles.total}
            >
              {moneyWithCents(remote.rows?.sales_amount || 0)}
            </Copy>
            <View style={styles.summaryMetrics}>
              <SummaryMetric
                label="Vendas concluídas"
                value={remote.rows?.sales_count || 0}
                colors={colors}
              />
              <SummaryMetric
                label="Propostas abertas"
                value={remote.rows?.open_proposals || 0}
                colors={colors}
              />
            </View>
          </View>
        ) : (
          <Copy tone="mediaMuted">Os resultados comerciais ainda não estão disponíveis.</Copy>
        )}

        <View style={[styles.financeAccess, { borderTopColor: colors.heroBorder }]}>
          <Copy size={type.caption} weight="600" tone="mediaAccent" style={styles.flexContent}>
            Abrir Financeiro e registrar vendas
          </Copy>
          <Icon name="arrow-forward-outline" size={18} color={colors.mediaAccent} />
        </View>
        <Copy size={11} tone="mediaMuted">
          Valor vendido não significa dinheiro recebido.
        </Copy>
      </View>
    </Pressable>
  );
}

function AccessTile({ item, wide = false, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={`Abre ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.accessTile,
        wide ? styles.wideTile : styles.compactTile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.65 : 1,
        },
        colors.lift,
      ]}
    >
      <View style={[styles.accessIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon name={item.icon} size={22} color={colors.accentText} />
      </View>
      <View style={[styles.accessText, wide && styles.flexContent]}>
        <Copy weight="600" numberOfLines={1}>
          {item.title}
        </Copy>
        <Copy tone="muted" size={type.caption} numberOfLines={wide ? 1 : 2}>
          {item.subtitle}
        </Copy>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function MainAccesses({ onNavigate }) {
  return (
    <View style={styles.accessSection}>
      <Copy accessibilityRole="header" display size={22} weight="600">
        Acessos principais
      </Copy>
      <View style={styles.accessGrid}>
        <View style={styles.accessRow}>
          {mainAccesses.slice(0, 2).map((item) => (
            <AccessTile key={item.route} item={item} onPress={() => onNavigate(item.route)} />
          ))}
        </View>
        <AccessTile item={mainAccesses[2]} wide onPress={() => onNavigate(mainAccesses[2].route)} />
      </View>
    </View>
  );
}

export default function ManagementScreen() {
  const router = useRouter();
  const remote = useCommercial('summary');
  return (
    <Screen>
      <Header
        kicker="SUA OPERAÇÃO"
        title="Gestão"
        subtitle="Resultados em destaque. O essencial ao seu alcance."
      />
      {!remote.session ? (
        <Button title="Entrar na conta" onPress={() => router.push('/login')} />
      ) : (
        <View style={styles.summarySection}>
          {remote.error && (
            <View style={styles.errorSection}>
              <Notice error>{remote.error}</Notice>
              <Button title="Tentar novamente" onPress={remote.reload} />
            </View>
          )}
          <Overview remote={remote} onPress={() => router.push('/finance')} />
        </View>
      )}
      <MainAccesses onNavigate={(route) => router.push(route)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flexContent: { flex: 1 },
  summarySection: { marginTop: space.sm },
  errorSection: { gap: space.sm, marginBottom: space.md },
  overview: {
    overflow: 'hidden',
    borderWidth: 0.75,
    borderRadius: radius.lg,
    flexDirection: 'row',
  },
  overviewAccent: { width: 3 },
  overviewContent: { flex: 1, padding: space.lg, gap: space.md },
  overviewHeading: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  overviewIcon: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  separator: { height: 0.75 },
  results: { gap: space.sm },
  total: { letterSpacing: -1 },
  summaryMetrics: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  summaryMetric: {
    flex: 1,
    minWidth: 0,
    padding: space.md,
    borderRadius: radius.sm,
    gap: space.xs,
  },
  financeAccess: {
    borderTopWidth: 0.75,
    paddingTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  accessSection: { gap: space.md, marginTop: space.xl },
  accessGrid: { gap: space.md },
  accessRow: { flexDirection: 'row', gap: space.md },
  accessTile: {
    borderRadius: radius.md,
    borderWidth: 0.75,
    padding: space.lg,
    gap: space.sm,
    minHeight: 76,
  },
  compactTile: { flex: 1, minWidth: 0, minHeight: 154 },
  wideTile: { flexDirection: 'row', alignItems: 'center', minHeight: 88 },
  accessIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  accessText: { gap: space.xs },
});
