import React, { useState } from 'react';
import { Card, Copy, Field, Button, Notice } from './ui';
import { SelectField } from './SelectField';
import { commercialApi } from '../hooks/useCommercial';
import { moneyWithCents } from '../utils/catalog';
import { commercialResults, saleResult, saleDay } from '../utils/commercialResults';
export function CommercialResultsPanel({ remote }) {
  const [query, setQuery] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState('');
  const [form, setForm] = useState(null),
    [confirm, setConfirm] = useState(false);
  const change = (key, value) => {
    setConfirm(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const validDate = (value) =>
    !value ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value);
  const invalid = !validDate(from) || !validDate(to) || (from && to && from > to);
  const rows = (remote.rows || []).filter(
    (s) =>
      !invalid &&
      (!from || saleDay(s.sold_at) >= from) &&
      (!to || saleDay(s.sold_at) <= to) &&
      `${s.customer_name} ${s.vehicle_title}`.toLowerCase().includes(query.toLowerCase()),
  );
  const totals = commercialResults(rows);
  return (
    <>
      <Field label="Pesquisar vendas" value={query} onChangeText={setQuery} />
      <Field label="De (AAAA-MM-DD)" value={from} onChangeText={setFrom} />
      <Field label="Até (AAAA-MM-DD)" value={to} onChangeText={setTo} />
      {invalid && <Notice error>Informe um período válido.</Notice>}
      <Card>
        <Copy weight="700">{totals.count} vendas concluídas</Copy>
        <Copy>Valor vendido: {moneyWithCents(totals.revenue)}</Copy>
        <Copy>Custos conhecidos: {moneyWithCents(totals.knownCosts)}</Copy>
        <Copy>
          Lucro bruto apurado:{' '}
          {totals.margin === null ? 'Não disponível' : moneyWithCents(totals.profit)}
        </Copy>
        <Copy>
          Margem bruta: {totals.margin === null ? 'Não disponível' : `${totals.margin.toFixed(2)}%`}
        </Copy>
        <Copy size={12}>
          Valor vendido não significa dinheiro recebido. Lucro e margem consideram somente vendas
          com ambos os custos registrados.
        </Copy>
        {!!totals.unknown && (
          <Notice>
            {totals.unknown} vendas com custos desconhecidos, excluídas do lucro e da margem.
          </Notice>
        )}
        {!!totals.invalid && (
          <Notice error>{totals.invalid} vendas com valor inválido, excluídas dos cálculos.</Notice>
        )}
      </Card>
      {remote.personalReady && !form && (
        <Button
          title="Registrar venda direta"
          onPress={() =>
            setForm({
              customer_id: '',
              vehicle_id: '',
              amount: '',
              terms: '',
              sold_at: new Date().toISOString(),
            })
          }
        />
      )}
      {form && (
        <Card>
          <Copy weight="700">Venda direta</Copy>
          <SelectField
            label="Cliente *"
            value={form.customer_id}
            options={(remote.customers || [])
              .filter((c) => !c.archived)
              .map((c) => ({ id: c.id, title: c.name }))}
            onChange={(v) => change('customer_id', v)}
            allowEmpty={false}
          />
          <SelectField
            label="Veículo *"
            value={form.vehicle_id}
            options={(remote.vehicles || [])
              .filter((v) => v.commercial_status === 'available')
              .map((v) => ({ id: v.id, title: v.title }))}
            onChange={(v) => change('vehicle_id', v)}
            allowEmpty={false}
          />
          <Field
            label="Preço efetivo (R$) *"
            value={form.amount}
            keyboardType="decimal-pad"
            onChangeText={(v) => change('amount', v)}
          />
          <Field
            label="Data da venda (ISO ou AAAA-MM-DD)"
            value={form.sold_at}
            onChangeText={(v) => change('sold_at', v)}
          />
          <Field
            label="Condições comerciais *"
            value={form.terms}
            multiline
            maxLength={2000}
            onChangeText={(v) => change('terms', v)}
          />
          {!confirm ? (
            <Button title="Revisar venda" onPress={() => setConfirm(true)} />
          ) : (
            <>
              <Notice>
                Concluir por R$ {form.amount}? O estoque será marcado como vendido e o anúncio
                arquivado. O histórico será preservado.
              </Notice>
              <Button
                title="Confirmar venda direta"
                loading={remote.busy}
                onPress={async () => {
                  if (await remote.run(() => commercialApi.directSale(form))) {
                    setForm(null);
                    setConfirm(false);
                  }
                }}
              />
            </>
          )}
          <Button
            title="Cancelar registro"
            variant="text"
            disabled={remote.busy}
            onPress={() => {
              setForm(null);
              setConfirm(false);
            }}
          />
        </Card>
      )}
      {!rows.length && <Copy>Nenhuma venda concluída neste período.</Copy>}
      {rows.map((s) => {
        const r = saleResult(s);
        return (
          <Card key={s.id}>
            <Copy weight="700">{s.vehicle_title}</Copy>
            <Copy>{s.customer_name}</Copy>
            <Copy>
              {moneyWithCents(s.amount)} · {s.proposal_id ? 'Por proposta' : 'Direta'}
            </Copy>
            <Copy>
              Lucro bruto: {r.profit === null ? 'Custo não informado' : moneyWithCents(r.profit)}
            </Copy>
            <Copy>{s.terms}</Copy>
            <Copy size={12}>
              {new Date(s.sold_at).toLocaleString('pt-BR')} · Venda {s.id}
            </Copy>
          </Card>
        );
      })}
    </>
  );
}
