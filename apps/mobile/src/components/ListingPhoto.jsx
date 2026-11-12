import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Media, Copy, Button } from './ui';
export function ListingPhoto({ path, label, style }) {
  const [uri, setUri] = useState(null);
  const [error, setError] = useState(false),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0);
  const { session } = useAuth();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setUri(null);
      setError(false);
      setLoading(Boolean(path));
      const refresh = () => {
        if (!path || !supabase) {
          setLoading(false);
          if (path) setError(true);
          return;
        }
        supabase.storage
          .from('listing-photos')
          .createSignedUrl(path, 300)
          .then(({ data, error }) => {
            if (active) {
              setUri(data?.signedUrl || null);
              setError(Boolean(error || !data?.signedUrl));
            }
          })
          .catch(() => {
            if (active) {
              setUri(null);
              setError(true);
            }
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      };
      refresh();
      const timer = path ? setInterval(refresh, 240000) : null;
      return () => {
        active = false;
        if (timer) clearInterval(timer);
      };
    }, [path, session?.user.id, revision]),
  );
  if (path && (loading || error))
    return (
      <View
        style={[style, { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }]}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Copy size={13}>Foto indisponível ou sem permissão.</Copy>
            <Button
              title="Recarregar foto"
              variant="secondary"
              onPress={() => setRevision((n) => n + 1)}
            />
          </>
        )}
      </View>
    );
  return <Media uri={uri} label={label} style={style} onRetry={() => setRevision((n) => n + 1)} />;
}
