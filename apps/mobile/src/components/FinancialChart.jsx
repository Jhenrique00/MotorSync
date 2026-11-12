import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { Copy, Button } from './ui';
import { SelectField } from './SelectField';
import { financialSeries } from '../services/financeApi';
import { moneyWithCents } from '../utils/catalog';
export function FinancialChart({ buckets: originalBuckets, range, onSelect }) {
  const buckets = range ? financialSeries(originalBuckets, range.from, range.to) : originalBuckets;
  const { colors } = useTheme();
  const [metric, setMetric] = useState('revenue');
  const [width, setWidth] = useState(280);
  if (!buckets?.length)
    return <Copy tone="muted">O gráfico aparece quando houver registros neste período.</Copy>;
  const incomplete = buckets.some((b) => Number(b.missing_cost) > 0);
  const metrics = [
    { id: 'revenue', title: 'Receita de vendas' },
    { id: 'cost', title: incomplete ? 'Custos informados (parcial)' : 'Custos das vendas' },
    { id: 'expenses', title: 'Despesas operacionais' },
    ...(!incomplete
      ? [
          ...(buckets.some((b) => Number(b.revenue) > 0)
            ? [{ id: 'gross', title: 'Lucro bruto dos registros' }]
            : []),
          { id: 'result', title: 'Resultado dos registros' },
        ]
      : []),
  ];
  const key = metrics.some((option) => option.id === metric) ? metric : 'revenue';
  const value = (b) =>
    key === 'gross'
      ? Number(b.revenue) - Number(b.cost)
      : key === 'result'
        ? Number(b.revenue) + Number(b.income) - Number(b.cost) - Number(b.expenses)
        : Number(b[key]);
  return (
    <View style={{ gap: 10 }} onLayout={(e) => setWidth(Math.max(200, e.nativeEvent.layout.width))}>
      <SelectField
        label="Indicador do gráfico"
        allowEmpty={false}
        value={key}
        options={metrics}
        onChange={setMetric}
      />
      {incomplete && (
        <Copy size={12} tone="muted">
          Há vendas sem custo informado. Lucro e resultado não podem ser calculados.
        </Copy>
      )}
      <ScrollView horizontal>
        <LineChart
          data={{
            labels: buckets.map((b, i) =>
              i % Math.max(1, Math.ceil(buckets.length / 5)) === 0 || i === buckets.length - 1
                ? b.day.slice(5).split('-').reverse().join('/')
                : '',
            ),
            datasets: [{ data: buckets.map(value) }],
          }}
          width={width}
          height={200}
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => colors.accentText,
            labelColor: () => colors.muted,
            propsForDots: { r: buckets.length > 30 ? '2' : '4' },
          }}
          withShadow={false}
          withVerticalLines={false}
          onDataPointClick={({ index }) => onSelect?.(buckets[index])}
        />
      </ScrollView>
      <Copy size={12} tone="muted">
        Totais registrados em R$. Dias sem registros somam zero. Toque em um ponto para detalhar.
      </Copy>
      <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
        {buckets.map((b) => (
          <Button
            key={b.day}
            title={`${b.day}: ${moneyWithCents(value(b))}`}
            variant="secondary"
            onPress={() => onSelect?.(b)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
