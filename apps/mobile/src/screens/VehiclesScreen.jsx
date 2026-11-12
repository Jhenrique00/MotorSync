import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { vehicleApi } from '../services/vehicleApi';
import { commercialApi } from '../hooks/useCommercial';
import { vehicleStatusLabels } from '../utils/commercial';
import { moneyWithCents } from '../utils/catalog';
import { Screen, Header, Copy, Card, Button, Field, Notice } from '../components/ui';
export default function VehiclesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [retry, setRetry] = useState(0);
  const [membersLoading, setMembersLoading] = useState(true);
  const [commercialReady, setCommercialReady] = useState(false);
  const [personalReady, setPersonalReady] = useState(false);
  const [purchaseCost, setPurchaseCost] = useState(''),
    [preparationCost, setPreparationCost] = useState('');
  const [stateChange, setStateChange] = useState(null);
  const generation = useRef(0);
  const [members, setMembers] = useState([]),
    [org, setOrg] = useState(null),
    [rows, setRows] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [title, setTitle] = useState(''),
    [price, setPrice] = useState(''),
    [edit, setEdit] = useState(null),
    [deleting, setDeleting] = useState(null);
  useEffect(() => {
    let active = true;
    const n = ++generation.current;
    setRows([]);
    setMembers([]);
    setOrg(null);
    setTitle('');
    setPrice('');
    setPurchaseCost('');
    setPreparationCost('');
    setEdit(null);
    setDeleting(null);
    setError('');
    setBusy(false);
    setMembersLoading(true);
    setCommercialReady(false);
    setPersonalReady(false);
    setStateChange(null);
    if (session)
      commercialApi
        .ready()
        .then(async (ready) => {
          const personal = ready && (await commercialApi.personalReady());
          if (active) {
            setCommercialReady(ready);
            setPersonalReady(personal);
          }
        })
        .catch(() => {
          if (active) setError('Não foi possível verificar o serviço comercial.');
        });
    if (session && vehicleApi)
      vehicleApi
        .organizations()
        .then((data) => {
          if (n === generation.current) setMembers(data);
        })
        .catch(() => {
          if (n === generation.current) setError('Não foi possível consultar suas empresas.');
        })
        .finally(() => {
          if (n === generation.current) setMembersLoading(false);
        });
    return () => {
      active = false;
      generation.current++;
    };
  }, [session?.user?.id, retry]);
  async function selectOrg(id) {
    const n = ++generation.current;
    setOrg(id);
    setStateChange(null);
    setRows([]);
    setEdit(null);
    setDeleting(null);
    setTitle('');
    setPrice('');
    setPurchaseCost('');
    setPreparationCost('');
    setError('');
    setBusy(true);
    try {
      const data = await vehicleApi.list(id);
      if (n === generation.current) setRows(data);
    } catch {
      if (n === generation.current)
        setError('Não foi possível carregar os veículos. Tente novamente.');
    } finally {
      if (n === generation.current) setBusy(false);
    }
  }
  async function mutate(action) {
    if (busy) return;
    const n = generation.current;
    let saved = false;
    setBusy(true);
    setError('');
    try {
      await action();
      saved = true;
      if (n !== generation.current) return;
      setEdit(null);
      setDeleting(null);
      setStateChange(null);
      setTitle('');
      setPrice('');
      setPurchaseCost('');
      setPreparationCost('');
      const data = await vehicleApi.list(org);
      if (n === generation.current) setRows(data);
    } catch (e) {
      if (n === generation.current)
        setError(
          saved
            ? 'Alteração salva, mas a atualização da lista falhou. Toque em Atualizar estoque.'
            : e.message || 'Não foi possível salvar.',
        );
    } finally {
      if (n === generation.current) setBusy(false);
    }
  }
  const writable =
    (org === 'personal' && personalReady) ||
    ['owner', 'manager', 'seller'].includes(members.find((m) => m.organization_id === org)?.role);
  return (
    <Screen>
      <Header back title="Estoque" />
      {!session ? (
        <Button title="Entrar na conta" onPress={() => router.push('/login')} />
      ) : (
        <>
          {error ? (
            <>
              <Notice error>{error}</Notice>
              <Button
                title="Tentar novamente"
                disabled={busy}
                onPress={() => (org ? selectOrg(org) : setRetry((n) => n + 1))}
              />
            </>
          ) : null}
          {personalReady && (
            <Button
              title="Meu estoque pessoal"
              disabled={busy}
              onPress={() => selectOrg('personal')}
            />
          )}
          {membersLoading ? (
            <Copy>Carregando empresas…</Copy>
          ) : !members.length ? (
            <Copy>
              {personalReady
                ? 'Selecione seu estoque pessoal acima.'
                : 'Gestão pessoal aguarda atualização autorizada do banco.'}
            </Copy>
          ) : (
            members.map((m) => (
              <Button
                key={m.organization_id}
                title={m.organizations?.name || 'Empresa'}
                disabled={busy}
                onPress={() => selectOrg(m.organization_id)}
              />
            ))
          )}
          {org && (
            <>
              <Button
                title={org === 'personal' ? 'Meus anúncios' : 'Anúncios da empresa'}
                variant="secondary"
                onPress={() =>
                  router.push(
                    org === 'personal' ? '/my-listings' : `/my-listings?organization=${org}`,
                  )
                }
              />
              <Button title="Atualizar estoque" disabled={busy} onPress={() => selectOrg(org)} />
              {busy && <Copy>Carregando…</Copy>}
              {writable && (
                <Card>
                  <Copy>{edit ? 'Editar veículo' : 'Cadastrar veículo'}</Copy>
                  <Field label="Marca e modelo" value={title} onChangeText={setTitle} />
                  <Field
                    label="Preço (R$)"
                    keyboardType="decimal-pad"
                    value={price}
                    onChangeText={setPrice}
                  />
                  {personalReady && (
                    <>
                      <Field
                        label="Preço de compra (R$; vazio = desconhecido)"
                        value={purchaseCost}
                        keyboardType="decimal-pad"
                        onChangeText={setPurchaseCost}
                      />
                      <Field
                        label="Custos de preparação (R$; vazio = desconhecido)"
                        value={preparationCost}
                        keyboardType="decimal-pad"
                        onChangeText={setPreparationCost}
                      />
                    </>
                  )}
                  <Button
                    title="Salvar veículo"
                    loading={busy}
                    onPress={() =>
                      mutate(() =>
                        vehicleApi.save(
                          org,
                          {
                            title,
                            price,
                            ...(personalReady
                              ? { purchase_cost: purchaseCost, preparation_cost: preparationCost }
                              : {}),
                          },
                          edit,
                        ),
                      )
                    }
                  />
                  {edit && (
                    <Button
                      title="Cancelar edição"
                      onPress={() => {
                        setEdit(null);
                        setTitle('');
                        setPrice('');
                        setPurchaseCost('');
                        setPreparationCost('');
                      }}
                    />
                  )}
                </Card>
              )}
              {!busy && !rows.length && <Copy>Nenhum veículo cadastrado.</Copy>}
              {rows.map((row) => (
                <Card key={row.id}>
                  <Copy weight="700">{row.title}</Copy>
                  <Copy>{moneyWithCents(row.price)}</Copy>
                  <Copy>{vehicleStatusLabels[row.commercial_status || 'available']}</Copy>
                  {writable && row.commercial_status !== 'sold' && (
                    <>
                      {commercialReady && row.commercial_status === 'available' && (
                        <Button
                          title="Anunciar este veículo"
                          variant="secondary"
                          onPress={() =>
                            router.push(
                              `/ad/new?kind=vehicles&organization=${org === 'personal' ? '' : org}&vehicle=${row.id}`,
                            )
                          }
                        />
                      )}
                      {commercialReady && (
                        <Button
                          title={
                            row.commercial_status === 'available'
                              ? 'Colocar em preparação'
                              : row.commercial_status === 'reserved'
                                ? 'Liberar reserva'
                                : 'Disponibilizar veículo'
                          }
                          variant="secondary"
                          disabled={busy}
                          onPress={() =>
                            setStateChange({
                              id: row.id,
                              status:
                                row.commercial_status === 'available' ? 'preparing' : 'available',
                            })
                          }
                        />
                      )}
                      {stateChange?.id === row.id && (
                        <>
                          <Notice>
                            {stateChange.status === 'preparing'
                              ? 'Colocar em preparação? O anúncio vinculado será arquivado e novas propostas ficarão bloqueadas.'
                              : 'Disponibilizar o veículo? A reserva será liberada, se houver. O anúncio não será republicado automaticamente.'}
                          </Notice>
                          <Button
                            title="Confirmar estado do veículo"
                            disabled={busy}
                            onPress={() =>
                              mutate(() =>
                                commercialApi.setVehicleState(row.id, stateChange.status),
                              )
                            }
                          />
                          <Button
                            title="Manter estado"
                            variant="text"
                            onPress={() => setStateChange(null)}
                          />
                        </>
                      )}
                      <Button
                        title="Editar"
                        disabled={busy}
                        onPress={() => {
                          setEdit(row.id);
                          setTitle(row.title);
                          setPrice(String(row.price));
                          setPurchaseCost(
                            row.purchase_cost == null ? '' : String(row.purchase_cost),
                          );
                          setPreparationCost(
                            row.preparation_cost == null ? '' : String(row.preparation_cost),
                          );
                        }}
                      />
                      <Button title="Excluir" disabled={busy} onPress={() => setDeleting(row.id)} />
                      {deleting === row.id && (
                        <>
                          <Notice>Excluir este veículo permanentemente?</Notice>
                          <Button
                            title="Confirmar exclusão"
                            disabled={busy}
                            onPress={() => mutate(() => vehicleApi.remove(org, row.id))}
                          />
                          <Button title="Manter veículo" onPress={() => setDeleting(null)} />
                        </>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
