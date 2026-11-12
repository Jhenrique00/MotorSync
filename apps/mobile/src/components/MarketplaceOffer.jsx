import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Copy, Field, Notice } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { commercialApi } from '../hooks/useCommercial';
import { commercialError } from '../utils/commercial';
export function MarketplaceOffer({ listing }) {
  const { session } = useAuth(),
    router = useRouter();
  const generation = useRef(0),
    lock = useRef(false);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [form, setForm] = useState({ name: '', phone: '', amount: String(listing.price), terms: '' });
  useEffect(() => {
    let active = true;
    generation.current++;
    lock.current = false;
    setSent(false);
    setError('');
    setBusy(false);
    setForm({ name: '', phone: '', amount: String(listing.price), terms: '' });
    setReady(false);
    if (session)
      commercialApi
        .ready()
        .then((value) => {
          if (active) setReady(value);
        })
        .catch(() => {
          if (active)
            setError('Não foi possível consultar o serviço de propostas. Reabra o anúncio.');
        });
    return () => {
      active = false;
      generation.current++;
    };
  }, [session?.user.id, listing.id]);
  if (!listing.vehicle_id || listing.publication_status !== 'published') return null;
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <Card>
      <Copy weight="700">Proposta para o vendedor</Copy>
      {error && <Notice error>{error}</Notice>}
      {!session ? (
        <Button title="Entrar para enviar proposta" onPress={() => router.push('/login')} />
      ) : !ready ? (
        <Copy>Propostas aguardam a atualização do serviço.</Copy>
      ) : sent ? (
        <>
          <Copy>Proposta enviada. Ela ainda não representa uma compra concluída.</Copy>
          <Button title="Acompanhar proposta" onPress={() => router.push('/management/mine')} />
        </>
      ) : (
        <>
          <Field
            label="Seu nome *"
            value={form.name}
            maxLength={150}
            onChangeText={(v) => change('name', v)}
          />
          <Field
            label="Seu telefone"
            value={form.phone}
            keyboardType="phone-pad"
            maxLength={30}
            onChangeText={(v) => change('phone', v)}
          />
          <Field
            label="Sua oferta (R$) *"
            value={form.amount}
            keyboardType="decimal-pad"
            onChangeText={(v) => change('amount', v)}
          />
          <Field
            label="Condições da oferta *"
            value={form.terms}
            multiline
            maxLength={2000}
            onChangeText={(v) => change('terms', v)}
          />
          <Copy size={12}>
            Seu nome, e-mail da conta e telefone serão compartilhados com o vendedor para a
            negociação.
          </Copy>
          <Button
            title="Enviar oferta"
            loading={busy}
            onPress={async () => {
              if (lock.current) return;
              lock.current = true;
              const current = generation.current;
              setBusy(true);
              setError('');
              try {
                await commercialApi.offer(listing.id, form);
                if (current === generation.current) setSent(true);
              } catch (e) {
                if (current === generation.current) setError(commercialError(e));
              } finally {
                if (current === generation.current) {
                  setBusy(false);
                  lock.current = false;
                }
              }
            }}
          />
        </>
      )}
    </Card>
  );
}
