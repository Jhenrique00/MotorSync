import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useDemo } from '../contexts/DemoContext';
import {
  Screen,
  Header,
  Card,
  Copy,
  Field,
  Button,
  DemoNotice,
  EmptyState,
} from '../components/ui';
export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const { state, dispatch } = useDemo();
  const [text, setText] = useState('');
  const post = state.posts.find((p) => p.id === id);
  return (
    <Screen>
      <Header back title="Comentários" />
      <DemoNotice />
      {!post ? (
        <EmptyState title="Publicação indisponível" description="Volte para o feed." />
      ) : (
        <>
          {post.comments.length ? (
            post.comments.map((comment) => (
              <Card key={comment.id}>
                <Copy weight="700">{comment.author}</Copy>
                <Copy>{comment.text}</Copy>
              </Card>
            ))
          ) : (
            <EmptyState
              title="Comece a conversa"
              description="Adicione um comentário demonstrativo."
            />
          )}
          <Field
            label="Seu comentário"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            placeholder="Escreva aqui…"
            style={{ minHeight: 110, textAlignVertical: 'top' }}
          />
          <Button
            title="Adicionar comentário local"
            disabled={!text.trim()}
            onPress={() => {
              dispatch({
                type: 'comment',
                id,
                text,
                commentId: `local-${Date.now()}-${Math.random()}`,
              });
              setText('');
            }}
          />
        </>
      )}
    </Screen>
  );
}
