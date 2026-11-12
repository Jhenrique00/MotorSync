export const proposalLabels = {
  draft: 'Rascunho',
  sent: 'Enviada',
  accepted: 'Aceita',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
  completed: 'Venda concluída',
};
export const vehicleStatusLabels = {
  preparing: 'Em preparação',
  available: 'Disponível',
  reserved: 'Reservado',
  sold: 'Vendido',
};
export function canCompleteSale(proposal, vehicle) {
  return (
    proposal.status === 'accepted' &&
    Boolean(vehicle) &&
    (vehicle.commercial_status === 'available' ||
      (vehicle.commercial_status === 'reserved' && vehicle.reserved_proposal_id === proposal.id))
  );
}
export const proposalTransitions = {
  draft: ['sent', 'cancelled'],
  sent: ['accepted', 'rejected', 'cancelled'],
  accepted: ['cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
};
export function commercialId(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || ''))
    throw new Error('Selecione um registro válido.');
  return value;
}
export function validateCustomer(values) {
  const name = String(values.name || '').trim();
  const email = String(values.email || '').trim();
  const phone = String(values.phone || '').trim();
  if (!name || name.length > 150) throw new Error('Informe um nome com até 150 caracteres.');
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    throw new Error('Informe um e-mail válido.');
  if (phone && (phone.length < 8 || phone.length > 30 || !/^[+0-9 ()-]+$/.test(phone)))
    throw new Error('Informe um telefone válido.');
  const notes = String(values.notes || '').trim();
  if (notes.length > 4000) throw new Error('Observações: máximo de 4.000 caracteres.');
  return { name, email, phone, ...(values.notes !== undefined ? { notes } : {}) };
}
export function validateProposal(values) {
  const raw = String(values.amount ?? '')
    .trim()
    .replace(',', '.');
  const terms = String(values.terms || '').trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 999999999999.99)
    throw new Error('Informe um valor positivo com até duas casas decimais.');
  if (!terms || terms.length > 2000)
    throw new Error('Informe as condições comerciais com até 2.000 caracteres.');
  return { amount: Number(raw), terms };
}
export function commercialError(error) {
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error?.code))
    return 'O fluxo comercial aguarda a atualização autorizada do banco.';
  if (error?.code === '42501') return 'Você não tem permissão para esta operação.';
  if (error?.code === '23503')
    return 'Este registro possui vínculos comerciais. Preserve o histórico e arquive o cliente.';
  if (error?.code === '23505')
    return 'Já existe um registro para esta operação. Atualize a lista antes de tentar novamente.';
  if (!error?.code || error.code === 'P0001')
    return error?.message || 'Não foi possível concluir. Verifique a conexão e atualize a lista.';
  return 'Não foi possível concluir. Confira os dados e atualize a lista.';
}
