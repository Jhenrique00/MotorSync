import React from 'react';
import { taxonomy, categoryPath } from '../data/taxonomy';
import { adaptSelection } from '../services/exploreApi';
import { ExploreSheet } from './ExploreSheet';
import { Copy, Button, RowLink } from './ui';
export function CategoryPanel({ visible, onClose, selection, onChange, onApply }) {
  const group = taxonomy.find((c) => c.id === selection.category);
  return (
    <ExploreSheet
      visible={visible}
      title="Categorias"
      onClose={onClose}
      footer={<Button title="Aplicar categoria" onPress={onApply} />}
    >
      <Copy tone="muted">O que você está procurando?</Copy>
      <Copy weight="700">
        {categoryPath(selection.category, selection.subcategory) || 'Todas as categorias'}
      </Copy>
      <Button
        title="Todas as categorias"
        variant="text"
        onPress={() => onChange(adaptSelection(selection, '', ''))}
      />
      {taxonomy.map((c) => (
        <RowLink
          key={c.id}
          title={c.title}
          selected={selection.category === c.id}
          onPress={() => onChange(adaptSelection(selection, c.id, ''))}
        />
      ))}
      {group && (
        <>
          <Copy weight="700">Tipos de {group.title.toLowerCase()}</Copy>
          <Button
            title={`Todos em ${group.title}`}
            variant="secondary"
            onPress={() => onChange(adaptSelection(selection, group.id, ''))}
          />
          {group.children.map((c) => (
            <RowLink
              key={c.id}
              title={c.title}
              selected={selection.subcategory === c.id}
              onPress={() => onChange(adaptSelection(selection, group.id, c.id))}
            />
          ))}
        </>
      )}
    </ExploreSheet>
  );
}
