import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useDemo } from '../contexts/DemoContext';
import { socialApi } from '../services/socialApi';
import { isUuid } from '../utils/identifiers.js';
import {
  Screen,
  Header,
  Card,
  Copy,
  Field,
  Button,
  DemoNotice,
  EmptyState,
  Notice,
} from '../components/ui';

export default function CommentsScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { state, dispatch } = useDemo();
  const online = isUuid(id);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(online);
  const [error, setError] = useState('');
  const demoPost = state.posts.find((p) => p.id === id);

  useFocusEffect(
    useCallback(() => {
      if (!online) return;
      let active = true;
      setLoading(true);
      setError('');
      Promise.all([socialApi?.get(id), socialApi?.comments(id)])
        .then(([result, rows]) => {
          if (active) {
            setPost(result);
            setComments(rows || []);
          }
        })
        .catch(() => {
          if (active) setError('Não foi possível carregar os comentários. Verifique a conexão.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id, online]),
  );

  async function send() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError('');
    try {
      if (online) {
        const comment = await socialApi.addComment(id, text, replyTo);
        setComments((items) => [...items, comment]);
        setReplyTo(null);
      } else {
        dispatch({ type: 'comment', id, text, commentId: `local-${Date.now()}` });
      }
      setText('');
    } catch (failure) {
      setError(failure?.message || 'Não foi possível adicionar o comentário.');
    } finally {
      setBusy(false);
    }
  }

  const visibleComments = online ? comments : demoPost?.comments || [];
  return (
    <Screen>
      <Header back title="Comentários" />
      {!online && <DemoNotice />}
      {error ? <Notice error>{error}</Notice> : null}
      {loading ? (
        <Copy tone="muted">Carregando conversa…</Copy>
      ) : online && !post ? (
        <EmptyState title="Publicação indisponível" description="Volte ao feed para continuar." />
      ) : !online && !demoPost ? (
        <EmptyState title="Publicação indisponível" description="Volte para o feed." />
      ) : (
        <>
          <Copy size={14} tone="muted">
            {online ? post.title : demoPost.title}
          </Copy>
          {visibleComments.length ? (
            visibleComments.map((comment) => (
              <View key={comment.id} style={{ marginLeft: comment.parent_id ? 20 : 0 }}>
                <Card>
                  <Copy weight="700">{comment.author_name || comment.author || 'Motorista'}</Copy>
                  <Copy>{comment.body || comment.text}</Copy>
                  {online && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Responder a ${comment.author_name}`}
                      onPress={() => setReplyTo(comment.id)}
                      style={{ minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center' }}
                    >
                      <Copy size={13} tone="accentText" weight="600">
                        Responder
                      </Copy>
                    </Pressable>
                  )}
                </Card>
              </View>
            ))
          ) : (
            <EmptyState
              title="Comece a conversa"
              description={
                online
                  ? 'Seja a primeira pessoa a comentar.'
                  : 'Adicione um comentário demonstrativo.'
              }
            />
          )}
          {replyTo && (
            <Pressable accessibilityRole="button" onPress={() => setReplyTo(null)}>
              <Copy tone="accentText" size={13}>
                Respondendo a um comentário · Cancelar resposta
              </Copy>
            </Pressable>
          )}
          <Field
            label={replyTo ? 'Sua resposta' : 'Seu comentário'}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            placeholder="Escreva aqui…"
            style={{ minHeight: 110, textAlignVertical: 'top' }}
          />
          <Button
            title={
              online
                ? replyTo
                  ? 'Responder'
                  : 'Publicar comentário'
                : 'Adicionar comentário local'
            }
            loading={busy}
            disabled={!text.trim() || busy}
            onPress={send}
          />
        </>
      )}
    </Screen>
  );
}
