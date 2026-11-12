import React, { useState } from 'react';
import { Screen, Header, Button, Copy, Notice } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCommercial } from '../hooks/useCommercial';
import { CustomersPanel } from '../components/CustomersPanel';
import { ProposalsPanel } from '../components/ProposalsPanel';
import { CommercialResultsPanel } from '../components/CommercialResultsPanel';
const titles = {
  clients: 'Clientes',
  proposals: 'Propostas',
  sales: 'Resultados e vendas',
  mine: 'Minhas propostas',
};
export default function CommercialScreen({ sectionOverride }) {
  const params = useLocalSearchParams();
  const section = sectionOverride || params.section;
  const router = useRouter();
  const [org, setOrg] = useState(params.organization || 'personal');
  const remote = useCommercial(section, org);
  const member =
    (org === 'personal' && remote.personalReady) ||
    remote.members?.some((m) => m.organization_id === org);
  return (
    <Screen>
      <Header back title={titles[section] || 'Comercial'} />
      {!remote.session ? (
        <Button title="Entrar na conta" onPress={() => router.push('/login')} />
      ) : (
        <>
          {remote.error && <Notice error>{remote.error}</Notice>}
          {remote.loading ? (
            <Copy>Carregando…</Copy>
          ) : !remote.ready ? (
            <>
              <Copy>O fluxo comercial aguarda a atualização autorizada do banco.</Copy>
              <Button title="Verificar novamente" onPress={remote.reload} />
            </>
          ) : (
            <>
              {section !== 'mine' && (
                <SelectField
                  label="Gestão"
                  value={org}
                  options={[
                    ...(remote.personalReady ? [{ id: 'personal', title: 'Pessoal' }] : []),
                    ...remote.members.map((m) => ({
                      id: m.organization_id,
                      title: m.organizations?.name || 'Empresa',
                    })),
                  ]}
                  onChange={setOrg}
                  allowEmpty={false}
                />
              )}
              {section !== 'mine' && !remote.personalReady && !remote.members.length && (
                <Copy>Gestão pessoal aguarda a atualização autorizada do banco.</Copy>
              )}
              <Button
                title="Atualizar"
                variant="secondary"
                disabled={remote.busy}
                onPress={remote.reload}
              />
              {section === 'clients' && member && (
                <CustomersPanel key={org} org={org} remote={remote} />
              )}
              {section === 'proposals' && member && (
                <ProposalsPanel key={org} org={org} remote={remote} />
              )}
              {section === 'mine' && <ProposalsPanel remote={remote} buyer />}
              {section === 'sales' && member && (
                <CommercialResultsPanel key={org} remote={remote} />
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
