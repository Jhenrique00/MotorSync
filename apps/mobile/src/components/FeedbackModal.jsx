import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Modal, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Copy, Button, Icon } from './ui';
export function FeedbackModal({ value, onConfirm }) {
  const { colors, reduceMotion } = useTheme();
  return (
    <Modal
      visible={Boolean(value)}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onConfirm}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 24 }}
      >
        <ScrollView
          style={{
            maxHeight: '100%',
            width: '100%',
            maxWidth: 440,
            alignSelf: 'center',
            flexGrow: 0,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={{ gap: 16 }}>
            <View accessibilityViewIsModal>
              <Icon
                name={value?.error ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={32}
                color={value?.error ? colors.danger : colors.success}
              />
              <Copy accessibilityRole="header" size={20} weight="700">
                {value?.title || 'Aviso'}
              </Copy>
              <Copy>{value?.message}</Copy>
            </View>
            <Button title="Confirmar" onPress={onConfirm} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
