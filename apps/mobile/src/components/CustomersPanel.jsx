import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Card, Copy, Field, Notice } from './ui';
import { CustomerHistory } from './CustomerHistory';
import { commercialApi } from '../hooks/useCommercial';
const empty = { name: '', email: '', phone: '' };
export function CustomersPanel({ org, remote }) {
  const [form, setForm] = useState(empty),
    [editing, setEditing] = useState(null),
    [formOpen, setFormOpen] = useState(false),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState(null),
    [deleting, setDeleting] = useState(null);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const rows = [...(remote.rows || [])]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .filter((c) =>
      `${c.name} ${c.email} ${c.phone}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')),
    );
  return (
    <>
      <Field label="Pesquisar clientes" value={query} onChangeText={setQuery} />
      {!formOpen && (
        <Button
          title="Adicionar cliente"
          icon="add"
          disabled={remote.busy}
          onPress={() => {
            setForm(empty);
            setEditing(null);
            setSelected(null);
            setDeleting(null);
            setFormOpen(true);
          }}
        />
      )}
      {formOpen && (
        <Card>
          <Copy weight="700">{editing ? 'Editar cliente' : 'Novo cliente'}</Copy>
          <Field
            label="Nome do cliente *"
            value={form.name}
            maxLength={150}
            onChangeText={(v) => update('name', v)}
          />
          <Field
            label="E-mail do cliente"
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(v) => update('email', v)}
          />
          <Field
            label="Telefone do cliente"
            value={form.phone}
            keyboardType="phone-pad"
            maxLength={30}
            onChangeText={(v) => update('phone', v)}
          />
          {remote.personalReady && (
            <Field
              label="Observações"
              value={form.notes || ''}
              multiline
              maxLength={4000}
              onChangeText={(v) => update('notes', v)}
            />
          )}
          <Button
            title="Salvar cliente"
            loading={remote.busy}
            onPress={async () => {
              if (await remote.run(() => commercialApi.saveCustomer(org, form, editing))) {
                setForm(empty);
                setEditing(null);
                setFormOpen(false);
              }
            }}
          />
          <Button
            title={editing ? 'Cancelar edição' : 'Cancelar cadastro'}
            variant="text"
            disabled={remote.busy}
            onPress={() => {
              setForm(empty);
              setEditing(null);
              setFormOpen(false);
            }}
          />
        </Card>
      )}
      {!rows.length && <Copy>Nenhum cliente encontrado.</Copy>}
      {rows.map((customer) => (
        <Card key={customer.id}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ficha de ${customer.name}`}
            accessibilityState={{ expanded: selected === customer.id }}
            disabled={remote.busy}
            style={{ paddingVertical: 12, gap: 6 }}
            onPress={() => {
              setSelected(selected === customer.id ? null : customer.id);
              setDeleting(null);
              setFormOpen(false);
              setEditing(null);
              setForm(empty);
            }}
          >
            <Copy weight="700">
              {customer.name}
              {customer.archived ? ' · Arquivado' : ''}
            </Copy>
            <Copy>{customer.email || customer.phone || 'Sem contato informado'}</Copy>
            <Copy size={12} tone="muted">
              {selected === customer.id ? 'Fechar ficha ↑' : 'Ver ficha →'}
            </Copy>
          </Pressable>
          {selected === customer.id && (
            <>
              <CustomerHistory customer={customer} org={org} remote={remote} />
              <Button
                title={`Editar ${customer.name}`}
                variant="secondary"
                disabled={remote.busy}
                onPress={() => {
                  setForm(customer);
                  setEditing(customer.id);
                  setFormOpen(true);
                }}
              />
              <Button
                title={customer.archived ? 'Reativar cliente' : 'Arquivar cliente'}
                variant="text"
                disabled={remote.busy}
                onPress={() =>
                  remote.run(() =>
                    commercialApi.archiveCustomer(org, customer.id, !customer.archived),
                  )
                }
              />
              <Button
                title="Excluir cliente"
                variant="text"
                disabled={remote.busy}
                onPress={() => setDeleting(customer.id)}
              />
              {deleting === customer.id && (
                <>
                  <Notice>
                    Excluir somente se não houver histórico comercial? Clientes com propostas ou
                    vendas devem ser arquivados.
                  </Notice>
                  <Button
                    title="Confirmar exclusão do cliente"
                    loading={remote.busy}
                    onPress={async () => {
                      if (await remote.run(() => commercialApi.deleteCustomer(org, customer.id)))
                        setDeleting(null);
                    }}
                  />
                  <Button title="Manter cliente" variant="text" onPress={() => setDeleting(null)} />
                </>
              )}
            </>
          )}
        </Card>
      ))}
    </>
  );
}
