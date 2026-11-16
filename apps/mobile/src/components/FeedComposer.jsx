import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button, Copy, Icon, IconButton, Media, Notice } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { socialApi } from '../services/socialApi';
import { useAuth } from '../contexts/AuthContext';
import { feedTypography } from '../theme/feedTypography';

export function FeedComposer({
  onAddPost,
  requestOpen = 0,
  remoteMode = false,
  previewMode = false,
  loading = false,
}) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [listings, setListings] = useState([]);
  const [listingId, setListingId] = useState(null);
  const [showListings, setShowListings] = useState(false);
  useEffect(() => {
    if (requestOpen > 0) setVisible(true);
  }, [requestOpen]);
  useEffect(() => {
    setListings([]);
    setListingId(null);
    if (!visible || !remoteMode || !socialApi || !session?.user?.id) return;
    let active = true;
    socialApi
      .myListings()
      .then((items) => {
        if (active) setListings(items);
      })
      .catch(() => {
        if (active) setListings([]);
      });
    return () => {
      active = false;
    };
  }, [visible, remoteMode, session?.user?.id]);
  const reset = () => {
    setTitle('');
    setBody('');
    setPhoto(null);
    setListingId(null);
    setShowListings(false);
    setError('');
  };
  const close = () => {
    setVisible(false);
    reset();
  };
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhoto(result.assets[0]);
        setError('');
      }
    } catch {
      setError('Não foi possível abrir a galeria neste dispositivo.');
    }
  };
  const submit = async () => {
    if (
      busy ||
      loading ||
      (!remoteMode && !previewMode) ||
      (!title.trim() && !body.trim() && !photo)
    )
      return;
    setBusy(true);
    setError('');
    try {
      await onAddPost({ title: title.trim(), body: body.trim(), photo, listingId });
      close();
    } catch (failure) {
      setError(failure?.message || 'Não foi possível publicar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Criar publicação automotiva"
        onPress={() => setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          borderWidth: 0.75,
          borderColor: colors.border,
          borderRadius: 20,
          backgroundColor: colors.surface,
          ...colors.lift,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.accentSoft,
          }}
        >
          <Icon name="person-outline" color={colors.accentText} size={20} />
        </View>
        <Copy tone="muted" style={[feedTypography.body, { flex: 1 }]} numberOfLines={2}>
          O que está acontecendo no mundo automotivo?
        </Copy>
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 999,
            paddingHorizontal: 14,
            minHeight: 40,
            justifyContent: 'center',
          }}
        >
          <Copy tone="onAccent" style={feedTypography.action}>
            Novo post
          </Copy>
        </View>
      </Pressable>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 48 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconButton name="close" label="Fechar criação de post" onPress={close} />
                <Copy style={[feedTypography.composeTitle, { flex: 1 }]}>Nova publicação</Copy>
              </View>
              <Notice>
                {remoteMode
                  ? 'Sua publicação será exibida na comunidade com o nome definido no Perfil; sem nome, mostramos um código público da conta.'
                  : loading
                    ? 'Verificando a disponibilidade da comunidade…'
                    : previewMode
                      ? 'Prévia local: esta publicação não será salva no Supabase.'
                      : 'A comunidade online está indisponível. Confira a conexão antes de publicar.'}
              </Notice>
              <View style={{ gap: 8 }}>
                <Copy style={feedTypography.fieldLabel}>Título (opcional)</Copy>
                <TextInput
                  accessibilityLabel="Título da publicação"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={90}
                  placeholder="Uma novidade da garagem..."
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.fieldBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    ...feedTypography.input,
                  }}
                />
              </View>
              <View style={{ gap: 8 }}>
                <Copy style={feedTypography.fieldLabel}>Legenda</Copy>
                <TextInput
                  accessibilityLabel="Legenda da publicação"
                  value={body}
                  onChangeText={setBody}
                  maxLength={1000}
                  placeholder="Conte algo sobre seu carro, projeto ou evento..."
                  placeholderTextColor={colors.muted}
                  multiline
                  style={{
                    minHeight: 130,
                    textAlignVertical: 'top',
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.fieldBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    ...feedTypography.input,
                  }}
                />
              </View>
              {photo ? (
                <View style={{ gap: 8 }}>
                  <Media
                    uri={photo.uri}
                    label="Prévia da foto escolhida"
                    style={{ height: 220, borderRadius: 14 }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setPhoto(null)}
                    style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
                  >
                    <Copy tone="accentText" weight="600">
                      Remover foto
                    </Copy>
                  </Pressable>
                </View>
              ) : null}
              <Button
                title={photo ? 'Trocar foto' : 'Adicionar foto'}
                variant="secondary"
                icon="images-outline"
                onPress={pickImage}
              />
              {remoteMode && listings.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Vincular anúncio à publicação"
                    onPress={() => setShowListings((value) => !value)}
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Copy size={14} weight="600" tone="accentText">
                      {listingId ? 'Anúncio vinculado · Alterar' : 'Vincular anúncio (opcional)'}
                    </Copy>
                  </Pressable>
                  {showListings && (
                    <View style={{ gap: 8 }}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setListingId(null);
                          setShowListings(false);
                        }}
                        style={{
                          padding: 10,
                          borderWidth: 1,
                          borderRadius: 10,
                          borderColor: colors.border,
                        }}
                      >
                        <Copy size={13}>Sem anúncio vinculado</Copy>
                      </Pressable>
                      {listings.map((item) => (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Vincular ${item.title}`}
                          onPress={() => {
                            setListingId(item.id);
                            setShowListings(false);
                          }}
                          style={{
                            padding: 10,
                            borderWidth: 1,
                            borderRadius: 10,
                            borderColor: item.id === listingId ? colors.accentText : colors.border,
                          }}
                        >
                          <Copy size={13} numberOfLines={2}>
                            {item.title}
                          </Copy>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {error ? <Notice error>{error}</Notice> : null}
              <Button
                title={
                  remoteMode
                    ? 'Publicar na comunidade'
                    : previewMode
                      ? 'Mostrar prévia no feed'
                      : 'Publicação indisponível'
                }
                icon="send-outline"
                disabled={
                  busy ||
                  loading ||
                  (!remoteMode && !previewMode) ||
                  (!title.trim() && !body.trim() && !photo)
                }
                loading={busy}
                onPress={submit}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
