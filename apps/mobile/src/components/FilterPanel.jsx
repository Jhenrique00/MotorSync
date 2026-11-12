import React, { useState } from 'react';
import { View } from 'react-native';
import { ExploreSheet } from './ExploreSheet';
import { Copy, Button, Field, Notice, styles } from './ui';
import { SelectField } from './SelectField';
import { fieldsFor, attributes, categoryPath } from '../data/taxonomy';
import { validateFilters } from '../data/listingRules';
import { useListingChoices } from '../hooks/useExplore';
function Choice({ field, selection, onChange }) {
  const state = useListingChoices(selection, field);
  const ready =
    field === 'brand' || (field === 'model' ? selection.filters.brand : selection.filters.model);
  if (!ready)
    return (
      <Copy size={13} tone="muted">
        {field === 'model'
          ? 'Escolha a marca para ver os modelos.'
          : 'Escolha o modelo para ver as versões.'}
      </Copy>
    );
  if (state.loading)
    return <Copy size={13}>Consultando {attributes[field].label.toLowerCase()}…</Copy>;
  if (state.error)
    return (
      <Copy size={13}>
        Não foi possível consultar as opções. Reabra os filtros para tentar novamente.
      </Copy>
    );
  if (!state.options?.length)
    return (
      <Copy size={13} tone="muted">
        {attributes[field].label}: sem opções nos anúncios publicados.
      </Copy>
    );
  return (
    <SelectField
      label={attributes[field].label}
      value={selection.filters[field]}
      options={state.options}
      onChange={onChange}
    />
  );
}
export function FilterPanel({ visible, onClose, selection, onChange, onApply, advanced }) {
  const [error, setError] = useState('');
  const filters = selection.filters;
  const set = (key, value) => {
    const next = { ...filters, [key]: value };
    if (key === 'brand') {
      delete next.model;
      delete next.version;
    }
    if (key === 'model') delete next.version;
    onChange({ ...selection, filters: next });
    setError('');
  };
  const fields = (
    selection.category === 'vehicles' && !selection.subcategory
      ? []
      : fieldsFor(selection.category, selection.subcategory)
  ).filter((k) => k !== 'quantity');
  const range = (key, label) => (
    <View key={key} style={styles.row}>
      {['min', 'max'].map((b) => (
        <View key={b} style={{ flex: 1 }}>
          <Field
            label={`${label} ${b === 'min' ? 'mín.' : 'máx.'}`}
            value={filters[`${key}:${b}`] || ''}
            keyboardType="decimal-pad"
            onChangeText={(v) => set(`${key}:${b}`, v)}
          />
        </View>
      ))}
    </View>
  );
  return (
    <ExploreSheet
      visible={visible}
      title="Filtros"
      onClose={onClose}
      footer={
        <>
          <Button
            title="Ver resultados"
            onPress={() => {
              try {
                validateFilters(selection.category, selection.subcategory, filters);
                setError('');
                onApply();
              } catch (e) {
                setError(e.message);
              }
            }}
          />
          <Button
            title="Limpar filtros"
            variant="text"
            onPress={() => {
              onChange({ ...selection, filters: {} });
              setError('');
            }}
          />
        </>
      }
    >
      <Copy weight="700">
        {categoryPath(selection.category, selection.subcategory) || 'Todas as categorias'}
      </Copy>
      {!selection.category && (
        <Copy tone="muted">
          Preço e localização funcionam em todas as categorias. Escolha uma categoria para ver suas
          características.
        </Copy>
      )}
      {range('price', 'Preço (R$)')}
      <Field
        label="Localização"
        value={filters.location || ''}
        onChangeText={(v) => set('location', v)}
      />
      {fields.map((key) => {
        const f = attributes[key];
        if (f.numeric && !advanced) return null;
        if (['brand', 'model', 'version'].includes(key))
          return (
            <Choice key={key} field={key} selection={selection} onChange={(v) => set(key, v)} />
          );
        if (f.options)
          return (
            <SelectField
              key={key}
              label={f.label}
              value={filters[key]}
              options={f.options}
              onChange={(v) => set(key, v)}
            />
          );
        if (f.range) return range(key, f.label);
        return (
          <Field
            key={key}
            label={f.label}
            value={filters[key] || ''}
            keyboardType={f.numeric ? 'decimal-pad' : 'default'}
            onChangeText={(v) => set(key, v)}
          />
        );
      })}
      {!advanced && fields.some((k) => attributes[k].numeric) && (
        <Copy size={13} tone="muted">
          Filtros de ano e medidas serão liberados após a atualização da pesquisa. Os demais filtros
          já estão disponíveis.
        </Copy>
      )}
      {error && <Notice error>{error}</Notice>}
    </ExploreSheet>
  );
}
