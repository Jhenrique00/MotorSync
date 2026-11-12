import React, { useState, useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Screen, Header, Field, Button, Copy, Notice, EmptyState, styles } from '../components/ui';
import { CategoryPanel } from '../components/CategoryPanel';
import { FilterPanel } from '../components/FilterPanel';
import { SelectField } from '../components/SelectField';
import { MarketCard } from '../components/MarketCard';
import { RecentListings } from '../components/RecentListings';
import { useExplore } from '../hooks/useExplore';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { categoryPath } from '../data/taxonomy';
import { moneyWithCents } from '../utils/catalog';
import { PAGE_SIZE, adaptSelection } from '../services/exploreApi';
const empty = { category: '', subcategory: '', filters: {} };
export default function ExploreScreen() {
  const { state } = useDemo();
  const listRef = useRef(null);
  const [query, setQuery] = useState(''),
    [selection, setSelection] = useState(empty),
    [draft, setDraft] = useState(empty),
    [categoryDraft, setCategoryDraft] = useState(empty),
    [panel, setPanel] = useState(null),
    [sort, setSort] = useState('recent'),
    [favoritesOnly, setFavorites] = useState(false),
    [page, setPage] = useState(0);
  const remote = useExplore(
    { ...selection, query, sort, favoritesOnly, favorites: state.favorites },
    page,
  );
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);
  const filtersCount = Object.values(selection.filters).filter((v) => v !== '').length;
  const apply = () => {
    setSelection(draft);
    setPanel(null);
    setPage(0);
  };
  const clear = () => {
    setSelection(empty);
    setDraft(empty);
    setCategoryDraft(empty);
    setQuery('');
    setFavorites(false);
    setPage(0);
  };
  return (
    <Screen scroll={false}>
      <FlatList
        ref={listRef}
        keyboardDismissMode="on-drag"
        data={remote.rows || []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <MarketCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 12 }}>
            <Header
              title="Explorar"
              kicker="MARKETPLACE"
              subtitle="Encontre seu próximo caminho."
            />
            <Field
              label="Pesquisar anúncios"
              placeholder="Produto, marca ou cidade"
              maxLength={150}
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                setPage(0);
              }}
            />
            <View style={styles.row}>
              <Button
                title="Categorias"
                icon="grid-outline"
                style={{ flex: 1 }}
                onPress={() => setPanel('categories')}
              />
              <Button
                title={filtersCount ? `Filtros (${filtersCount})` : 'Filtros'}
                icon="options-outline"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => setPanel('filters')}
              />
            </View>
            <Copy size={13} weight="600">
              {categoryPath(selection.category, selection.subcategory) || 'Todas as categorias'}
              {filtersCount ? ` · ${filtersCount} filtros ativos` : ''}
            </Copy>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <SelectField
                  label="Ordenar por"
                  value={sort}
                  allowEmpty={false}
                  options={[
                    { id: 'recent', title: 'Mais recentes' },
                    { id: 'price-asc', title: 'Menor preço' },
                    { id: 'price-desc', title: 'Maior preço' },
                  ]}
                  onChange={(v) => {
                    setSort(v);
                    setPage(0);
                  }}
                />
              </View>
              <Button
                title={favoritesOnly ? 'Mostrar todos' : 'Favoritos'}
                variant="text"
                onPress={() => {
                  setFavorites((v) => !v);
                  setPage(0);
                }}
              />
            </View>
            {!query &&
              !selection.category &&
              !filtersCount &&
              !favoritesOnly &&
              page === 0 &&
              sort === 'recent' &&
              !remote.loading &&
              !remote.error && <RecentListings rows={(remote.rows || []).slice(0, 4)} />}
            {remote.loading ? (
              <Copy>Pesquisando anúncios…</Copy>
            ) : remote.error ? (
              <>
                <Notice error>{remote.error}</Notice>
                <Button title="Tentar novamente" onPress={remote.reload} />
              </>
            ) : typeof remote.count === 'number' ? (
              <Copy size={13} tone="muted">
                {remote.count} {remote.count === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}
              </Copy>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !remote.loading && !remote.error ? (
            <EmptyState
              title="Nenhum anúncio encontrado"
              description="Tente outra categoria ou remova algum filtro."
              action={<Button title="Limpar busca e filtros" onPress={clear} />}
            />
          ) : null
        }
        ListFooterComponent={
          !remote.loading && !remote.error && remote.count > 0 ? (
            <View style={{ gap: 10, paddingTop: 16 }}>
              <Copy size={13}>
                Página {page + 1} de {Math.ceil(remote.count / PAGE_SIZE)}
              </Copy>
              <View style={styles.row}>
                <Button
                  title="Anterior"
                  variant="secondary"
                  disabled={page === 0}
                  onPress={() => setPage((p) => p - 1)}
                />
                <Button
                  title="Próxima"
                  disabled={(page + 1) * PAGE_SIZE >= remote.count}
                  onPress={() => setPage((p) => p + 1)}
                />
              </View>
            </View>
          ) : null
        }
      />
      <CategoryPanel
        visible={panel === 'categories'}
        selection={categoryDraft}
        onChange={setCategoryDraft}
        onClose={() => setPanel(null)}
        onApply={() => {
          const next = adaptSelection(selection, categoryDraft.category, categoryDraft.subcategory);
          setSelection(next);
          if (next !== selection) setDraft(next);
          setPage(0);
          setPanel(null);
        }}
      />
      {panel === 'filters' && (
        <FilterPanel
          visible
          selection={draft}
          onChange={setDraft}
          advanced={remote.advanced}
          onClose={() => setPanel(null)}
          onApply={apply}
        />
      )}
    </Screen>
  );
}
