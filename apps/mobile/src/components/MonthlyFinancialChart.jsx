import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Copy } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { moneyWithCents } from '../utils/catalog';
import { monthlyFinancialPerformance } from '../utils/monthlyFinancialPerformance';
import { radius, space, type } from '../theme/tokens';

const HEIGHT = 118;

function Metric({ label, value, color }) {
  return (
    <View style={styles.metric}>
      <Copy size={type.caption} tone="muted">
        {label}
      </Copy>
      <Copy size={type.body} weight="700" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>
        {moneyWithCents(value)}
      </Copy>
    </View>
  );
}

export function MonthlyFinancialChart({ sales, endDate }) {
  const { colors } = useTheme();
  const [period, setPeriod] = useState(6);
  const [selectedKey, setSelectedKey] = useState(null);
  const data = useMemo(
    () => monthlyFinancialPerformance(sales, { months: period, endMonth: endDate?.slice(0, 7) }),
    [sales, period, endDate],
  );
  const selected =
    data.months.find((month) => month.key === selectedKey) ||
    [...data.months].reverse().find((month) => month.completeSales > 0) ||
    data.months.at(-1);
  const revenueColor = colors.info;
  const costColor = colors.muted;
  const max = data.maxValue;
  const monthLength = period === 12 ? 54 : undefined;
  const hasCompleteSales = data.completeSales > 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Copy display size={22} weight="600">
            Faturamento x custos
          </Copy>
          <Copy size={type.caption} tone="muted">
            Vendas concluídas com custos completos
          </Copy>
        </View>
        <View style={[styles.periodControls, { backgroundColor: colors.elevated }]}>
          {[6, 12].map((months) => (
            <Pressable
              key={months}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${months} meses`}
              accessibilityState={{ selected: period === months }}
              onPress={() => {
                setPeriod(months);
                setSelectedKey(null);
              }}
              style={({ pressed }) => [
                styles.periodButton,
                {
                  backgroundColor: period === months ? colors.accentSoft : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Copy
                size={type.caption}
                weight="700"
                tone={period === months ? 'accentText' : 'muted'}
              >
                {months}m
              </Copy>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: revenueColor }]} />
          <Copy size={type.caption}>Faturamento</Copy>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: costColor }]} />
          <Copy size={type.caption}>Custos</Copy>
        </View>
      </View>

      <ScrollView horizontal={period === 12} showsHorizontalScrollIndicator={false}>
        <View style={[styles.chart, { borderBottomColor: colors.border }]}>
          {data.months.map((month) => {
            const selectedMonth = month.key === selected.key;
            const height = (amount) =>
              max > 0 && amount > 0 ? Math.max(3, (amount / max) * HEIGHT) : 0;
            return (
              <Pressable
                key={month.key}
                accessibilityRole="button"
                accessibilityLabel={`${month.label} ${month.key.slice(0, 4)}: faturamento ${moneyWithCents(month.revenue)}, custos ${moneyWithCents(month.costs)}`}
                accessibilityState={{ selected: selectedMonth }}
                onPress={() => setSelectedKey(month.key)}
                style={({ pressed }) => [
                  styles.month,
                  monthLength ? { width: monthLength } : { flex: 1 },
                  { opacity: pressed ? 0.6 : selectedMonth ? 1 : 0.72 },
                ]}
              >
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.bar,
                      { height: height(month.revenue), backgroundColor: revenueColor },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      { height: height(month.costs), backgroundColor: costColor },
                    ]}
                  />
                </View>
                <Copy
                  size={type.caption}
                  weight={selectedMonth ? '700' : '400'}
                  tone={selectedMonth ? 'text' : 'muted'}
                >
                  {month.label}
                </Copy>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {!hasCompleteSales && (
        <Copy tone="muted" size={type.caption}>
          Sem vendas com custos completos nos meses exibidos.
        </Copy>
      )}

      {hasCompleteSales && (
        <View style={[styles.selection, { backgroundColor: colors.elevated }]}>
          <Copy weight="700">
            {selected.label} de {selected.key.slice(0, 4)}
          </Copy>
          <View style={styles.values}>
            <Metric label="Faturamento" value={selected.revenue} color={colors.text} />
            <Metric label="Custos" value={selected.costs} color={colors.text} />
          </View>
          <View style={styles.profit}>
            <Copy size={type.caption} tone="muted">
              Lucro bruto
            </Copy>
            <Copy
              weight="700"
              style={{ color: selected.profit < 0 ? colors.danger : colors.success }}
            >
              {moneyWithCents(selected.profit)}
            </Copy>
          </View>
        </View>
      )}
      {!!data.incompleteSales && (
        <Copy size={type.caption} tone="muted">
          {data.incompleteSales} venda(s) sem todos os custos informados não entram na comparação.
        </Copy>
      )}
      {!!data.invalidSales && (
        <Copy size={type.caption} tone="danger">
          {data.invalidSales} venda(s) com valor inválido não entram no gráfico.
        </Copy>
      )}
      <Copy size={12} tone="muted">
        Os valores representam vendas concluídas, não recebimentos em caixa. Toque em um mês para
        ver os detalhes.
      </Copy>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.lg },
  header: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  heading: { flex: 1, minWidth: 0, gap: space.xs },
  periodControls: { flexDirection: 'row', borderRadius: radius.md },
  periodButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  dot: { height: 10, width: 10, borderRadius: 5 },
  chart: { flexDirection: 'row', minWidth: '100%', borderBottomWidth: 1, paddingTop: space.sm },
  month: {
    minHeight: HEIGHT + 38,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.sm,
    paddingHorizontal: 2,
  },
  bars: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  bar: { width: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  selection: { padding: space.md, borderRadius: radius.md, gap: space.sm },
  values: { flexDirection: 'row', gap: space.md },
  metric: { flex: 1, minWidth: 0, gap: space.xs },
  profit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    flexWrap: 'wrap',
  },
});
