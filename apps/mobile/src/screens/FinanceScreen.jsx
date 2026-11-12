import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, Card, Copy, Button, Field, Notice, styles } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { ExploreSheet } from '../components/ExploreSheet';
import { FinancialChart } from '../components/FinancialChart';
import { FeedbackModal } from '../components/FeedbackModal';
import { useFinance, financeApi } from '../hooks/useFinance';
import { periodRange, periods, today, validateEntry } from '../services/financeApi';
import { moneyWithCents } from '../utils/catalog';
const types = [
  { id: '', title: 'Todos os lançamentos' },
  { id: 'sale', title: 'Vendas concluídas' },
  { id: 'income', title: 'Outras receitas' },
  { id: 'expense', title: 'Despesas' },
];
export default function FinanceScreen() {
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const identity = useRef(session?.user.id);
  identity.current = session?.user.id;
  const lock = useRef(false);
  const router = useRouter();
  const [org, setOrg] = useState(params.organization || ''),
    [period, setPeriod] = useState(params.period || '30'),
    [kind, setKind] = useState(''),
    [page, setPage] = useState(0),
    [day, setDay] = useState(params.day || null);
  const range = periodRange(period);
  const selectedRange = day
    ? {
        from: day,
        to:
          period === '12m'
            ? new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0))
                .toISOString()
                .slice(0, 10)
            : day,
      }
    : range;
  const remote = useFinance({ ...selectedRange, org, kind, page });
  const summary = remote.data?.summary;
  const [form, setForm] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(null),
    [detail, setDetail] = useState(null),
    [reason, setReason] = useState('');
  const reset = () => {
    setPage(0);
    setDay(null);
    setDetail(null);
    setForm(null);
    setError('');
  };
  useEffect(() => {
    setForm(null);
    setDetail(null);
    setError('');
    setFeedback(null);
  }, [session?.user.id, org]);
  async function save() {
    const savingUser = identity.current;
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      validateEntry(form);
      await financeApi.save(form, org, form.key, savingUser);
      if (identity.current !== savingUser) return;
      setForm(null);
      setFeedback({
        title: 'Lançamento registrado',
        message: 'Registro interno salvo. Isso não movimenta uma conta bancária.',
        success: true,
      });
      remote.reload();
    } catch (e) {
      setError(e.message || 'Não foi possível registrar.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const metric = (label, value, type) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Detalhar ${label}`}
      onPress={() => {
        setKind(type);
        setPage(0);
      }}
      style={{ minWidth: '45%', flex: 1 }}
    >
      <Card>
        <Copy size={12} tone="muted">
          {label}
        </Copy>
        <Copy weight="700" size={22}>
          {value === null || value === undefined ? '—' : moneyWithCents(value)}
        </Copy>
        <Copy size={12} tone="accentText">
          Ver lançamentos →
        </Copy>
      </Card>
    </Pressable>
  );
  return (
    <Screen>
      <Header back title="Financeiro" />
      <Copy tone="muted" size={13}>
        Controle interno · não é uma conta bancária
      </Copy>
      {remote.login ? (
        <Button title="Entrar na conta" onPress={() => router.push('/login')} />
      ) : (
        <>
          <SelectField
            label="Controle financeiro"
            allowEmpty={false}
            value={org || 'personal'}
            options={[
              { id: 'personal', title: 'Pessoal' },
              ...(remote.members || []).map((m) => ({
                id: m.organization_id,
                title: m.organizations?.name || 'Empresa',
              })),
            ]}
            onChange={(v) => {
              setOrg(v === 'personal' ? '' : v);
              reset();
            }}
          />
          <SelectField
            label="Período"
            allowEmpty={false}
            value={period}
            options={periods}
            onChange={(v) => {
              setPeriod(v);
              reset();
            }}
          />
          <Copy size={12} tone="muted">
            {selectedRange.from} a {selectedRange.to}
          </Copy>
          {day && (
            <Button
              title="Voltar ao período completo"
              variant="text"
              onPress={() => {
                setDay(null);
                setPage(0);
              }}
            />
          )}
          {remote.loading ? (
            <Copy>Carregando financeiro…</Copy>
          ) : remote.error ? (
            <>
              <Notice error>{remote.error}</Notice>
              <Button title="Tentar novamente" onPress={remote.reload} />
            </>
          ) : remote.pending ? (
            <Card>
              <Copy weight="700">Seu financeiro está sendo preparado</Copy>
              <Copy tone="muted">
                Receitas, despesas e histórico ficarão disponíveis após a atualização do serviço.
              </Copy>
              <Copy size={13}>Nenhum saldo ou resultado foi calculado.</Copy>
              <Button
                title="Verificar disponibilidade"
                variant="secondary"
                onPress={remote.reload}
              />
            </Card>
          ) : (
            <>
              <View style={[styles.wrap, { gap: 10 }]}>
                {metric('Receita de vendas', summary?.n ? summary.revenue : null, 'sale')}
                {metric('Outras receitas', summary?.n ? summary.income : null, 'income')}
                {metric('Despesas operacionais', summary?.n ? summary.expenses : null, 'expense')}
                {metric('Resultado dos registros', summary?.result, '')}
              </View>
              <Copy size={13}>
                Lucro bruto:{' '}
                {summary?.gross === null ? 'não calculável' : moneyWithCents(summary?.gross || 0)} ·
                Custos informados: {summary?.n ? moneyWithCents(summary.cost) : '—'}
              </Copy>
              <Copy size={12} tone="muted">
                Receitas e despesas seguem as datas registradas, não confirmação de recebimento ou
                pagamento. O resultado depende da inclusão de todos os custos e despesas; não
                representa saldo bancário.
              </Copy>
              {summary?.missing_cost > 0 && (
                <Notice>
                  Há {summary.missing_cost} vendas sem custo informado. Resultado indisponível.
                </Notice>
              )}
              <Card>
                <Copy weight="700">Evolução no período</Copy>
                <FinancialChart
                  buckets={remote.data.buckets}
                  range={selectedRange}
                  onSelect={(b) => {
                    setDay(b.day);
                    setPage(0);
                  }}
                />
              </Card>
              <View style={styles.row}>
                <Button
                  title="Registrar receita"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setError('');
                    setForm({
                      kind: 'income',
                      description: '',
                      amount: '',
                      occurred_on: today(),
                      key: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    });
                  }}
                />
                <Button
                  title="Registrar despesa"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setError('');
                    setForm({
                      kind: 'expense',
                      description: '',
                      amount: '',
                      occurred_on: today(),
                      key: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    });
                  }}
                />
              </View>
              <Copy size={20} weight="700">
                Histórico
              </Copy>
              <SelectField
                label="Tipo de lançamento"
                value={kind}
                options={types}
                allowEmpty={false}
                onChange={(v) => {
                  setKind(v);
                  setPage(0);
                }}
              />
              {!remote.data.rows.length ? (
                <Card>
                  <Copy weight="700">Nenhum lançamento neste período</Copy>
                  <Copy tone="muted">
                    Registre uma receita ou despesa, ou escolha outro período.
                  </Copy>
                </Card>
              ) : (
                remote.data.rows.map((row) => (
                  <Pressable
                    key={row.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Detalhes: ${row.description}`}
                    onPress={() => {
                      setDetail(row);
                      setReason('');
                      setError('');
                    }}
                  >
                    <Card>
                      <Copy weight="600">{row.description}</Copy>
                      <Copy>
                        {row.kind === 'expense' ? '− ' : ''}
                        {moneyWithCents(row.amount)}
                      </Copy>
                      <Copy size={12} tone="muted">
                        {row.occurred_on} · {types.find((t) => t.id === row.kind)?.title} ·{' '}
                        {row.cancellation_id ? 'Cancelado' : 'Registrado'}
                      </Copy>
                    </Card>
                  </Pressable>
                ))
              )}
              {remote.data.count > 20 && (
                <View style={styles.row}>
                  <Button title="Anterior" disabled={!page} onPress={() => setPage((p) => p - 1)} />
                  <Button
                    title="Próxima"
                    disabled={(page + 1) * 20 >= remote.data.count}
                    onPress={() => setPage((p) => p + 1)}
                  />
                </View>
              )}
              {remote.data.first_date && (
                <Copy size={12} tone="muted">
                  Primeiro registro: {remote.data.first_date}
                </Copy>
              )}
            </>
          )}
        </>
      )}
      <ExploreSheet
        visible={!!form}
        title={form?.kind === 'expense' ? 'Registrar despesa' : 'Registrar receita'}
        onClose={() => {
          if (!busy) setForm(null);
        }}
        footer={<Button title="Salvar lançamento" loading={busy} onPress={save} />}
      >
        {form && (
          <>
            <Copy size={13}>
              Registro manual interno. Uma venda deve ser registrada no módulo de vendas para
              incluir seu custo.
            </Copy>
            <Field
              label="Descrição"
              value={form.description}
              maxLength={300}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
            <Field
              label="Valor (R$)"
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={(v) => setForm({ ...form, amount: v })}
            />
            <Field
              label="Data (AAAA-MM-DD)"
              value={form.occurred_on}
              onChangeText={(v) => setForm({ ...form, occurred_on: v })}
            />
            {error && <Notice error>{error}</Notice>}
          </>
        )}
      </ExploreSheet>
      <ExploreSheet
        visible={!!detail}
        title="Detalhes do lançamento"
        onClose={() => {
          if (!busy) setDetail(null);
        }}
      >
        {detail && (
          <>
            <Copy weight="700">{detail.description}</Copy>
            <Copy>{moneyWithCents(detail.amount)}</Copy>
            <Copy>Data: {detail.occurred_on}</Copy>
            <Copy>Origem: {detail.kind === 'sale' ? 'Venda concluída' : 'Registro manual'}</Copy>
            <Copy>Situação: {detail.cancellation_id ? 'Cancelado' : 'Registrado'}</Copy>
            <Copy size={12}>Registro: {detail.id}</Copy>
            <Copy size={12}>Criado em: {detail.created_at}</Copy>
            {detail.cancellation_id ? (
              <Copy>Motivo: {detail.cancellation_reason}</Copy>
            ) : (
              <>
                <Field label="Motivo do cancelamento" value={reason} onChangeText={setReason} />
                <Copy size={12}>
                  Cancelar preserva o original e retira seu efeito dos relatórios. Não estorna
                  pagamentos bancários.
                </Copy>
                <Button
                  title="Confirmar cancelamento do registro"
                  variant="secondary"
                  loading={busy}
                  onPress={async () => {
                    if (busy) return;
                    setBusy(true);
                    try {
                      await financeApi.cancel(detail, org, reason, identity.current);
                      setDetail(null);
                      remote.reload();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </>
            )}
            {error && <Notice error>{error}</Notice>}
          </>
        )}
      </ExploreSheet>
      <FeedbackModal value={feedback} onConfirm={() => setFeedback(null)} />
    </Screen>
  );
}
