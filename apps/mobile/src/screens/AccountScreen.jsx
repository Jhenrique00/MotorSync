import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { createAccountApi } from '../services/accountApi';
import {
  Screen,
  Header,
  Notice,
  Field,
  Button,
  Section,
  Card,
  Copy,
  EmptyState,
} from '../components/ui';
const api = createAccountApi(supabase);
export default function AccountScreen() {
  const { session } = useAuth();
  const id = session?.user.id;
  const generation = useRef(0);
  const [record, setRecord] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const current = ++generation.current;
    setRecord(null);
    setName('');
    setError('');
    setMessage('');
    if (!id) {
      setBusy(false);
      return;
    }
    setBusy(true);
    api
      .load()
      .then((data) => {
        if (generation.current !== current) return;
        setRecord({ ...data, userId: id });
        setName(data.profile?.display_name || '');
      })
      .catch(() => {
        if (generation.current === current)
          setError('Não foi possível carregar sua conta. Verifique a conexão e tente novamente.');
      })
      .finally(() => {
        if (generation.current === current) setBusy(false);
      });
    return () => {
      generation.current++;
    };
  }, [id, retry]);
  async function save() {
    const current = generation.current;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const profile = await api.saveName(name);
      if (current !== generation.current) return;
      setRecord((old) => ({ ...old, profile }));
      setMessage('Perfil atualizado.');
    } catch {
      if (current === generation.current)
        setError('Não foi possível salvar. Confira o nome e tente novamente.');
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <Screen>
      <Header back title="Minha conta" subtitle={session?.user.email || ''} />
      {!id ? (
        <EmptyState
          title="Entre na sua conta"
          description="Uma sessão autenticada é necessária para consultar estes dados."
        />
      ) : (
        <>
          {error && (
            <>
              <Notice error>{error}</Notice>
              <Button
                title="Tentar novamente"
                variant="secondary"
                onPress={() => setRetry((value) => value + 1)}
                disabled={busy}
              />
            </>
          )}
          {record?.userId === id && (
            <>
              <Field label="Nome de exibição" value={name} onChangeText={setName} maxLength={100} />
              <Button title="Salvar nome" loading={busy} disabled={!name.trim()} onPress={save} />
              <Section title="Empresas vinculadas (opcional)">
                {record.memberships.length ? (
                  record.memberships.map((member) => (
                    <Card key={member.organization_id}>
                      <Copy weight="700">{member.organizations?.name || 'Empresa'}</Copy>
                      <Copy tone="muted">
                        {{ owner: 'Proprietário', manager: 'Gerente', seller: 'Vendedor' }[
                          member.role
                        ] || 'Membro'}
                      </Copy>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    title="Conta pessoal"
                    description="Você pode anunciar como pessoa física. Uma empresa só é necessária para trabalhar com estoque compartilhado."
                  />
                )}
              </Section>
            </>
          )}
          {busy && !record && <Copy>Carregando sua conta…</Copy>}
          {message && <Notice>{message}</Notice>}
        </>
      )}
    </Screen>
  );
}
