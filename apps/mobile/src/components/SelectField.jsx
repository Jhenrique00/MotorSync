import React, { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Copy, RowLink } from './ui';
export function SelectField({ label, value, options, onChange, allowEmpty = true }) {
  const [open, setOpen] = useState(false);
  const { colors, reduceMotion } = useTheme();
  const entries = options.map((o) => (typeof o === 'string' ? { id: o, title: o } : o));
  return (
    <View style={{ gap: 6 }}>
      <Copy size={14} weight="600">
        {label}
      </Copy>
      <Button
        variant="secondary"
        icon="chevron-down"
        title={entries.find((o) => o.id === value)?.title || 'Selecionar'}
        onPress={() => setOpen(true)}
      />
      <Modal
        visible={open}
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <Copy size={22} weight="700">
            {label}
          </Copy>
          <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 16 }}>
            {(allowEmpty
              ? [{ id: '', title: 'Qualquer / não informado' }, ...entries]
              : entries
            ).map((o) => (
              <RowLink
                key={o.id}
                title={o.title}
                onPress={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              />
            ))}
          </ScrollView>
          <Button title="Voltar" variant="secondary" onPress={() => setOpen(false)} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
