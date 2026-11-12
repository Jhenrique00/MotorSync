import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { listingApi } from '../services/listingApi';
import { photoPrefix } from '../data/listingRules';
import { validateListing } from '../services/listingRepository';
import { createAccountApi } from '../services/accountApi';
import { taxonomy, attributes, fieldsFor } from '../data/taxonomy';
import { Screen, Header, Field, Button, Copy, Notice, Card, Media, styles } from '../components/ui';
import { SelectField } from '../components/SelectField';
import { ListingPhoto } from '../components/ListingPhoto';
import { FeedbackModal } from '../components/FeedbackModal';
import { MarketplaceOffer } from '../components/MarketplaceOffer';
import { vehicleApi } from '../services/vehicleApi';
import { moneyWithCents } from '../utils/catalog';
const initial = {
  category: 'vehicles',
  subcategory: 'cars',
  title: '',
  price: '',
  location: '',
  description: '',
  attributes: {},
  photo_paths: [],
  publication_status: 'draft',
};
export default function AdScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const isNew = id === 'new';
  const router = useRouter();
  const { session } = useAuth();
  const [values, setValues] = useState({
      ...initial,
      category: params.kind || 'vehicles',
      subcategory: params.kind === 'parts' ? 'engine' : 'cars',
    }),
    [editing, setEditing] = useState(isNew || params.edit === '1'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [members, setMembers] = useState([]),
    [org, setOrg] = useState(''),
    [photos, setPhotos] = useState([]),
    [feedback, setFeedback] = useState(null),
    [review, setReview] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [available, setAvailable] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const uploaded = useRef(new Map());
  const [savedId, setSavedId] = useState(null);
  const change = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  useEffect(() => {
    let active = true;
    generation.current++;
    setSavedId(null);
    uploaded.current.clear();
    setPhotos([]);
    setLoading(true);
    setAvailable(false);
    setError('');
    (async () => {
      try {
        if (!listingApi) throw new Error('Serviço indisponível.');
        if (isNew && params.vehicle) {
          const linked = await listingApi.forVehicle(params.vehicle);
          if (linked) {
            router.replace(`/ad/${linked.id}?edit=1`);
            return;
          }
        }
        const record = isNew ? (await listingApi.catalog(), null) : await listingApi.get(id);
        const account = session ? await createAccountApi(supabase).load() : { memberships: [] };
        const stockVehicle = isNew && params.vehicle ? await vehicleApi.get(params.vehicle) : null;
        if (
          stockVehicle &&
          ((stockVehicle.organization_id || '') !== (params.organization || '') ||
            stockVehicle.commercial_status !== 'available')
        )
          throw new Error('Veículo indisponível.');
        if (active) {
          if (record) setValues(record);
          if (stockVehicle)
            setValues({
              ...initial,
              vehicle_id: stockVehicle.id,
              title: stockVehicle.title,
              price: String(stockVehicle.price),
            });
          setMembers(account.memberships);
          if (isNew)
            setOrg(
              account.memberships.some(
                (m) =>
                  m.organization_id === params.organization &&
                  ['owner', 'manager', 'seller'].includes(m.role),
              )
                ? params.organization
                : '',
            );
          setAvailable(true);
        }
      } catch (e) {
        if (active)
          setError(
            ['PGRST205', '42P01'].includes(e.code)
              ? 'A publicação de anúncios aguarda a atualização do serviço. Seu estoque empresarial continua disponível em Gestão.'
              : 'Não foi possível carregar este anúncio. Verifique sua conexão.',
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      generation.current++;
    };
  }, [id, session?.user.id]);
  const mayEdit = Boolean(
    session &&
      (isNew ||
        values.owner_user_id === session.user.id ||
        members.some(
          (m) =>
            m.organization_id === values.organization_id &&
            ['owner', 'manager', 'seller'].includes(m.role),
        )),
  );
  async function choosePhotos() {
    if (photos.length + values.photo_paths.length >= 6) {
      setError('Use até 6 fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length - values.photo_paths.length,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled)
      setPhotos((p) => [...p, ...result.assets].slice(0, 6 - values.photo_paths.length));
  }
  async function save() {
    if (lock.current || savedId) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const current = generation.current;
    try {
      validateListing(values);
      const paths = [...values.photo_paths];
      const ownerOrg = isNew ? org : values.organization_id;
      const prefix = photoPrefix(session.user.id, ownerOrg);
      for (const photo of photos) {
        if (current !== generation.current)
          throw new Error('A conta mudou. Abra o anúncio novamente.');
        const cacheKey = prefix + photo.uri;
        if (uploaded.current.has(cacheKey)) {
          paths.push(uploaded.current.get(cacheKey));
          continue;
        }
        if (!photo.base64) throw new Error('Não foi possível ler uma foto. Selecione novamente.');
        const mime = photo.mimeType || 'image/jpeg';
        const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime];
        if (!ext) throw new Error('Use fotos JPEG, PNG ou WebP.');
        const bytes = Uint8Array.from(atob(photo.base64), (c) => c.charCodeAt(0));
        if (bytes.length > 5242880) throw new Error('Cada foto deve ter até 5 MB.');
        const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, bytes.buffer, { contentType: mime });
        if (uploadError) throw uploadError;
        uploaded.current.set(cacheKey, path);
        paths.push(path);
      }
      if (current !== generation.current)
        throw new Error('A conta mudou. Abra o anúncio novamente.');
      const saved = await listingApi.save(
        { ...values, photo_paths: paths },
        isNew ? null : id,
        org || undefined,
      );
      if (current !== generation.current) return;
      setSavedId(saved.id);
      setPhotos([]);
      setValues(saved);
      setFeedback({
        title: 'Anúncio salvo',
        message:
          saved.publication_status === 'published'
            ? 'Seu anúncio foi publicado.'
            : saved.publication_status === 'archived'
              ? 'Anúncio arquivado. Novos compradores não poderão consultá-lo.'
              : 'Rascunho salvo. Você pode publicar depois.',
        success: true,
      });
    } catch (e) {
      if (current === generation.current)
        setError(e.message || 'Não foi possível salvar. Tente novamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await listingApi.remove(id);
      router.replace(
        values.organization_id
          ? `/my-listings?organization=${values.organization_id}`
          : '/my-listings',
      );
    } catch {
      setError('Não foi possível excluir. Tente novamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Header back title={isNew ? 'Novo anúncio' : editing ? 'Editar anúncio' : 'Anúncio'} />
      {loading && <Copy>Carregando…</Copy>}
      {error && <Notice error>{error}</Notice>}
      {!session && editing ? (
        <Button title="Entrar para anunciar" onPress={() => router.replace('/login')} />
      ) : available && (!editing || !mayEdit) ? (
        <>
          <ListingPhoto
            path={values.photo_paths[0]}
            label={values.title}
            style={{ height: 240, borderRadius: 16 }}
          />
          <Copy size={24} weight="700">
            {values.title}
          </Copy>
          <Copy size={24} weight="700">
            {moneyWithCents(values.price)}
          </Copy>
          <Copy>{values.location}</Copy>
          <Copy>{values.description}</Copy>
          {Object.entries(values.attributes).map(([k, v]) => (
            <Copy key={k} size={14}>
              {attributes[k]?.label || k}: {v}
            </Copy>
          ))}
          {mayEdit && <Button title="Editar anúncio" onPress={() => setEditing(true)} />}
          {!mayEdit && <MarketplaceOffer listing={values} />}
        </>
      ) : available && mayEdit ? (
        <>
          {review ? (
            <Card>
              <Copy weight="700">Confira antes de salvar</Copy>
              <Copy>{values.title}</Copy>
              <Copy>{moneyWithCents(Number(String(values.price).replace(',', '.')))}</Copy>
              <Copy>{values.location}</Copy>
              <Copy>
                {values.publication_status === 'published'
                  ? 'O anúncio e suas fotos ficarão visíveis aos compradores.'
                  : 'Somente você ou sua equipe poderão consultar este rascunho.'}
              </Copy>
              <Button title="Salvar anúncio" loading={busy} onPress={save} />
              <Button
                title="Voltar à edição"
                variant="secondary"
                disabled={busy}
                onPress={() => setReview(false)}
              />
            </Card>
          ) : (
            <>
              <Copy weight="700">Fotos · até 6</Copy>
              <View style={styles.wrap}>
                {values.photo_paths.map((path) => (
                  <View key={path} style={{ width: 140 }}>
                    <ListingPhoto path={path} label="Foto do anúncio" style={{ height: 110 }} />
                    <Button
                      title="Remover foto"
                      variant="text"
                      onPress={() =>
                        change(
                          'photo_paths',
                          values.photo_paths.filter((p) => p !== path),
                        )
                      }
                    />
                  </View>
                ))}
                {photos.map((p, i) => (
                  <View key={`${p.uri}-${i}`} style={{ width: 140 }}>
                    <Media uri={p.uri} label="Foto selecionada" style={{ height: 110 }} />
                    <Button
                      title="Remover foto"
                      variant="text"
                      onPress={() => setPhotos(photos.filter((_, j) => i !== j))}
                    />
                  </View>
                ))}
              </View>
              <Button
                title="Adicionar fotos"
                variant="secondary"
                onPress={() =>
                  choosePhotos().catch(() => setError('Não foi possível abrir suas fotos.'))
                }
              />
              {isNew && !values.vehicle_id && (
                <SelectField
                  label="Anunciar como"
                  value={org || 'personal'}
                  allowEmpty={false}
                  options={[
                    { id: 'personal', title: 'Pessoa física' },
                    ...members.map((m) => ({
                      id: m.organization_id,
                      title: m.organizations?.name || 'Empresa',
                    })),
                  ]}
                  onChange={(v) => setOrg(v === 'personal' ? '' : v)}
                />
              )}
              {values.vehicle_id ? (
                <Copy>Anúncio vinculado ao estoque.</Copy>
              ) : (
                <SelectField
                  label="Categoria *"
                  value={values.category}
                  options={taxonomy}
                  allowEmpty={false}
                  onChange={(v) =>
                    setValues((s) => ({ ...s, category: v, subcategory: '', attributes: {} }))
                  }
                />
              )}
              <SelectField
                label="Tipo *"
                value={values.subcategory}
                options={taxonomy.find((c) => c.id === values.category)?.children || []}
                allowEmpty={false}
                onChange={(v) => setValues((s) => ({ ...s, subcategory: v, attributes: {} }))}
              />
              <Field
                label="Título *"
                maxLength={150}
                value={values.title}
                onChangeText={(v) => change('title', v)}
              />
              {fieldsFor(values.category, values.subcategory).map((k) => {
                const f = attributes[k];
                const set = (v) => change('attributes', { ...values.attributes, [k]: v });
                return f.options ? (
                  <SelectField
                    key={k}
                    label={f.label}
                    value={values.attributes[k]}
                    options={f.options}
                    onChange={set}
                  />
                ) : (
                  <Field
                    key={k}
                    label={f.label}
                    maxLength={300}
                    value={String(values.attributes[k] ?? '')}
                    keyboardType={f.numeric ? 'decimal-pad' : 'default'}
                    onChangeText={set}
                  />
                );
              })}
              <Field
                label="Preço (R$) *"
                keyboardType="decimal-pad"
                value={String(values.price)}
                onChangeText={(v) => change('price', v)}
              />
              <Field
                label="Cidade e estado *"
                maxLength={150}
                value={values.location}
                onChangeText={(v) => change('location', v)}
              />
              <Field
                label="Descrição"
                multiline
                maxLength={4000}
                value={values.description}
                onChangeText={(v) => change('description', v)}
              />
              <SelectField
                label="Publicação"
                value={values.publication_status}
                allowEmpty={false}
                options={[
                  { id: 'draft', title: 'Salvar rascunho' },
                  { id: 'published', title: 'Publicar para compradores' },
                  { id: 'archived', title: 'Arquivar' },
                ]}
                onChange={(v) => change('publication_status', v)}
              />
              <Button
                title="Revisar anúncio"
                onPress={() => {
                  try {
                    validateListing(values);
                    setError('');
                    setReview(true);
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              />
            </>
          )}
          {!isNew &&
            (confirmDelete ? (
              <Card>
                <Copy>Excluir este anúncio? Esta ação não pode ser desfeita.</Copy>
                <Button title="Confirmar exclusão" loading={busy} onPress={remove} />
                <Button
                  title="Cancelar"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => setConfirmDelete(false)}
                />
              </Card>
            ) : (
              <Button
                title="Excluir anúncio"
                variant="secondary"
                onPress={() => setConfirmDelete(true)}
              />
            ))}
        </>
      ) : null}
      <FeedbackModal
        value={feedback}
        onConfirm={() => {
          setFeedback(null);
          router.replace(
            values.organization_id
              ? `/my-listings?organization=${values.organization_id}`
              : '/my-listings',
          );
        }}
      />
    </Screen>
  );
}
