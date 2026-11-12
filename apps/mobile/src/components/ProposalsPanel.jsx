import React, { useState } from 'react';
import { Button, Card, Copy, Field } from './ui';
import { SelectField } from './SelectField';
import { commercialApi } from '../hooks/useCommercial';
import {
  proposalLabels,
  proposalTransitions,
  canCompleteSale,
  vehicleStatusLabels,
} from '../utils/commercial';
import { moneyWithCents } from '../utils/catalog';
const empty = { customer_id: '', vehicle_id: '', amount: '', terms: '' };
export function ProposalsPanel({ org, remote, buyer = false, initialCustomer = '' }) {
  const [form, setForm] = useState({ ...empty, customer_id: initialCustomer }),
    [editing, setEditing] = useState(null),
    [filter, setFilter] = useState(''),
    [confirmSale, setConfirmSale] = useState(null),
    [confirmReservation, setConfirmReservation] = useState(null),
    [events, setEvents] = useState(null);
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const rows = (remote.rows || []).filter((p) => !filter || p.status === filter);
  return (
    <>
      {!buyer && (
        <Card>
          <Copy weight="700">{editing ? 'Editar rascunho' : 'Nova proposta'}</Copy>
          {(!editing || remote.personalReady) && (
            <>
              {!editing && (
                <SelectField
                  label="Cliente *"
                  value={form.customer_id}
                  options={(remote.customers || [])
                    .filter((c) => !c.archived)
                    .map((c) => ({ id: c.id, title: c.name }))}
                  onChange={(v) => change('customer_id', v)}
                  allowEmpty={false}
                />
              )}
              <SelectField
                label={remote.personalReady ? 'Veículo (opcional)' : 'Veículo *'}
                value={form.vehicle_id}
                options={(remote.vehicles || [])
                  .filter((v) => v.commercial_status === 'available')
                  .map((v) => ({ id: v.id, title: v.title }))}
                onChange={(v) => change('vehicle_id', v)}
                allowEmpty={remote.personalReady}
              />
            </>
          )}
          <Field
            label="Valor proposto (R$) *"
            keyboardType="decimal-pad"
            value={String(form.amount)}
            onChangeText={(v) => change('amount', v)}
          />
          <Field
            label="Condições comerciais *"
            multiline
            maxLength={2000}
            value={form.terms}
            onChangeText={(v) => change('terms', v)}
          />
          <Button
            title="Salvar rascunho"
            loading={remote.busy}
            onPress={async () => {
              if (
                await remote.run(() =>
                  editing
                    ? commercialApi.updateProposal(editing, form, 'draft')
                    : commercialApi.createProposal(org, form),
                )
              ) {
                setEditing(null);
                setForm(empty);
              }
            }}
          />
          {editing && (
            <Button
              title="Cancelar edição"
              variant="text"
              onPress={() => {
                setEditing(null);
                setForm(empty);
              }}
            />
          )}
        </Card>
      )}
      <SelectField
        label="Status da proposta"
        value={filter}
        options={Object.entries(proposalLabels).map(([id, title]) => ({ id, title }))}
        onChange={setFilter}
      />
      {!rows.length && <Copy>Nenhuma proposta encontrada.</Copy>}
      {rows.map((proposal) => (
        <Card key={proposal.id}>
          <Copy weight="700">
            {proposal.vehicles?.title || proposal.listings?.title || 'Proposta comercial'}
          </Copy>
          {proposal.customers?.name && <Copy>{proposal.customers.name}</Copy>}
          <Copy>
            {proposalLabels[proposal.status]} · {moneyWithCents(proposal.amount)}
          </Copy>
          <Copy>{proposal.terms}</Copy>
          <Copy size={12}>
            {new Date(proposal.created_at).toLocaleString('pt-BR')}
            {proposal.listing_id ? ' · Origem: marketplace' : ''}
          </Copy>
          {!buyer && proposal.status === 'draft' && (
            <Button
              title="Editar rascunho"
              variant="secondary"
              onPress={() => {
                setEditing(proposal.id);
                setForm(proposal);
              }}
            />
          )}
          {(proposalTransitions[proposal.status] || [])
            .filter((status) => !buyer || status === 'cancelled')
            .map((status) => (
              <Button
                key={status}
                title={
                  {
                    sent: 'Enviar proposta',
                    accepted: 'Aceitar proposta',
                    rejected: 'Recusar proposta',
                    cancelled: 'Cancelar proposta',
                  }[status]
                }
                variant="secondary"
                disabled={remote.busy}
                onPress={() =>
                  remote.run(() => commercialApi.updateProposal(proposal.id, proposal, status))
                }
              />
            ))}
          {!buyer && (
            <Copy size={12}>
              Estoque:{' '}
              {vehicleStatusLabels[
                remote.vehicles?.find((vehicle) => vehicle.id === proposal.vehicle_id)
                  ?.commercial_status
              ] || 'Indisponível'}
            </Copy>
          )}
          {!buyer &&
            proposal.status === 'accepted' &&
            remote.vehicles?.some(
              (vehicle) =>
                vehicle.id === proposal.vehicle_id && vehicle.commercial_status === 'available',
            ) && (
              <Button
                title="Reservar para esta proposta"
                variant="secondary"
                disabled={remote.busy}
                onPress={() => setConfirmReservation(proposal.id)}
              />
            )}
          {confirmReservation === proposal.id && (
            <>
              <Copy>
                Reservar este veículo? Novas ofertas serão bloqueadas e o anúncio será arquivado.
                Isso não conclui a venda.
              </Copy>
              <Button
                title="Confirmar reserva"
                loading={remote.busy}
                onPress={async () => {
                  if (
                    await remote.run(() =>
                      commercialApi.setVehicleState(proposal.vehicle_id, 'reserved', proposal.id),
                    )
                  )
                    setConfirmReservation(null);
                }}
              />
              <Button
                title="Não reservar"
                variant="text"
                onPress={() => setConfirmReservation(null)}
              />
            </>
          )}
          {!buyer &&
            canCompleteSale(
              proposal,
              remote.vehicles?.find((vehicle) => vehicle.id === proposal.vehicle_id),
            ) && (
              <Button
                title="Concluir venda"
                disabled={remote.busy}
                onPress={() => setConfirmSale(proposal.id)}
              />
            )}
          {confirmSale === proposal.id && (
            <>
              <Copy>
                Confirmar venda por {moneyWithCents(proposal.amount)}? O veículo será vendido, o
                anúncio arquivado e outras propostas abertas canceladas.
              </Copy>
              <Button
                title="Confirmar venda"
                loading={remote.busy}
                onPress={async () => {
                  if (await remote.run(() => commercialApi.completeSale(proposal.id)))
                    setConfirmSale(null);
                }}
              />
              <Button
                title="Voltar à negociação"
                variant="text"
                disabled={remote.busy}
                onPress={() => setConfirmSale(null)}
              />
            </>
          )}
          <Button
            title="Ver histórico"
            variant="text"
            disabled={remote.busy}
            onPress={() =>
              remote.run(
                async () =>
                  setEvents({ id: proposal.id, rows: await commercialApi.events(proposal.id) }),
                false,
              )
            }
          />
          {events?.id === proposal.id &&
            events.rows.map((event) => (
              <Copy key={event.id} size={12}>
                {new Date(event.occurred_at).toLocaleString('pt-BR')} ·{' '}
                {proposalLabels[event.status]} · {moneyWithCents(event.amount)} · {event.terms}
              </Copy>
            ))}
        </Card>
      ))}
    </>
  );
}
