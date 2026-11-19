import React, { useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Copy, Icon, IconButton, Media } from './ui';
import { ListingPhoto } from './ListingPhoto';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../contexts/DemoContext';
import { useListingFavorites } from '../contexts/ListingFavoritesContext';
import { money, moneyWithCents } from '../utils/catalog';
import { postAttribution, postDateLabel } from '../utils/postAttribution.js';
import { feedTypography } from '../theme/feedTypography';
import { hairline } from '../theme/tokens';

function EngagementButton({ icon, label, count, onPress, selected }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minHeight: 44,
        minWidth: 42,
        paddingHorizontal: 4,
      }}
    >
      <Icon name={icon} size={22} color={selected ? colors.accentText : colors.muted} />
      {count !== undefined && (
        <Copy size={12} tone={selected ? 'accentText' : 'muted'}>
          {count}
        </Copy>
      )}
    </Pressable>
  );
}

export function FeedPost({ post, onLike, onSave, onDelete }) {
  const { colors } = useTheme();
  const { state, dispatch } = useDemo();
  const favorites = useListingFavorites();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const listing = post.source === 'explore' ? post.listing : null;
  const demoListing = !listing ? state.listings.find((item) => item.id === post.listingId) : null;
  const target = listing
    ? `/ad/${listing.id}`
    : post.isRemote && post.listingId
      ? `/ad/${post.listingId}`
      : demoListing
        ? `/listing/${demoListing.id}`
        : null;
  const title = listing?.title || post.title;
  const description = listing
    ? [listing.description, listing.location].filter(Boolean).join(' · ')
    : post.text || '';
  const liked = post.isRemote ? post.liked : state.liked.includes(post.id);
  const saved = post.isRemote ? post.saved : state.saved.includes(post.id);
  const favorite = Boolean(listing && favorites.ids.includes(listing.id));
  const following = !listing && !post.isRemote && state.following.includes(post.author);
  const year = listing?.attributes?.year ?? demoListing?.year;
  const mileage = listing?.attributes?.mileage ?? demoListing?.mileage;
  const fuel = listing?.attributes?.fuel;
  const specs = [
    year,
    mileage ? `${Number(mileage).toLocaleString('pt-BR')} km` : null,
    fuel,
  ].filter(Boolean);
  const attribution = postAttribution(post);
  const publishedAt = postDateLabel(listing?.created_at || post.createdAt);
  const act = async (handler, fallback) => {
    if (actionBusy) return;
    setActionBusy(true);
    setShareFeedback('');
    try {
      if (post.isRemote) await handler(post);
      else fallback();
    } catch {
      setShareFeedback('Não foi possível sincronizar. Verifique a conexão.');
    } finally {
      setActionBusy(false);
    }
  };
  const toggleListingFavorite = async () => {
    if (!listing || actionBusy || favorites.busyIds.has(listing.id)) return;
    setShareFeedback('');
    setActionBusy(true);
    try {
      await favorites.toggle(listing.id);
    } catch (error) {
      setShareFeedback(
        error?.message === 'Entre na sua conta para salvar anúncios.'
          ? error.message
          : 'Não foi possível sincronizar este favorito.',
      );
    } finally {
      setActionBusy(false);
    }
  };
  const share = async () => {
    const text = `${title}${description ? `\n${description}` : ''}\nMotorSync${listing ? ' · confira o anúncio no Explorar' : post.isRemote ? ' · comunidade automotiva' : ' · publicação de demonstração'}`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          setShareFeedback('Texto copiado para compartilhar.');
        } else {
          setShareFeedback('O compartilhamento não está disponível neste navegador.');
        }
        return;
      }
      await Share.share({ message: text });
    } catch {
      setShareFeedback('Não foi possível compartilhar agora.');
    }
  };
  return (
    <View
      style={[
        {
          borderWidth: hairline,
          borderColor: colors.border,
          borderRadius: 22,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        colors.lift,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Copy size={12} weight="600" tone="accentText">
            {listing ? (
              <Icon name="car-sport-outline" color={colors.accentText} size={22} />
            ) : (
              attribution.initials.slice(0, 2)
            )}
          </Copy>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Copy tone="accentText" style={feedTypography.authorLabel}>
            {attribution.label}
          </Copy>
          <Copy style={feedTypography.authorName} numberOfLines={1}>
            {attribution.name}
          </Copy>
          <Copy tone="muted" style={feedTypography.authorMeta} numberOfLines={1}>
            {attribution.detail}
            {publishedAt ? ` · ${publishedAt}` : ''}
          </Copy>
        </View>
        {post.isRemote && post.isMine && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Opções da publicação"
            onPress={() => setOptionsOpen((value) => !value)}
            style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' }}
          >
            <Icon name="ellipsis-horizontal-outline" color={colors.muted} size={22} />
          </Pressable>
        )}
        {!listing && !post.isLocal && !post.isRemote && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              following ? `Deixar de seguir ${post.author}` : `Seguir ${post.author}`
            }
            accessibilityState={{ selected: following }}
            onPress={() => dispatch({ type: 'following', id: post.author })}
            style={{ paddingHorizontal: 8, minHeight: 44, justifyContent: 'center' }}
          >
            <Copy size={13} weight="700" tone="accentText">
              {following ? 'Seguindo' : 'Seguir'}
            </Copy>
          </Pressable>
        )}
      </View>
      {optionsOpen && post.isRemote && post.isMine && (
        <View style={{ paddingHorizontal: 15, paddingBottom: 10, gap: 8 }}>
          {confirmDelete ? (
            <View style={{ gap: 8 }}>
              <Copy size={13}>Excluir esta publicação e todos os seus comentários?</Copy>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmDelete(false)}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Copy weight="600" size={13}>
                    Cancelar
                  </Copy>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={actionBusy}
                  onPress={async () => {
                    if (actionBusy) return;
                    setActionBusy(true);
                    try {
                      await onDelete(post);
                    } catch {
                      setShareFeedback('Não foi possível excluir a publicação.');
                    } finally {
                      setActionBusy(false);
                      setConfirmDelete(false);
                      setOptionsOpen(false);
                    }
                  }}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Copy weight="700" size={13} tone="danger">
                    Excluir definitivamente
                  </Copy>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmDelete(true)}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Copy weight="600" size={13} tone="danger">
                Excluir publicação
              </Copy>
            </Pressable>
          )}
        </View>
      )}
      <View style={{ position: 'relative' }}>
        <Pressable
          accessibilityRole={target ? 'button' : undefined}
          accessibilityLabel={target ? `Ver anúncio de ${title}` : undefined}
          disabled={!target}
          onPress={() => router.push(target)}
        >
          {listing ? (
            <ListingPhoto
              path={listing.photo_paths?.[0]}
              label={title}
              style={{ aspectRatio: 1.2 }}
            />
          ) : post.image ? (
            <Media uri={post.image} label={title} style={{ aspectRatio: 1.2 }} />
          ) : (
            <View
              style={{
                aspectRatio: 1.8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.elevated,
                gap: 8,
              }}
            >
              <Icon name="car-sport-outline" size={40} color={colors.accentText} />
              <Copy tone="muted" size={13}>
                Publicação sem foto
              </Copy>
            </View>
          )}
        </Pressable>
        {(listing || demoListing) && (
          <LinearGradient
            pointerEvents="none"
            colors={['#00000000', '#000000A6']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }}
          />
        )}
        {specs.length > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              borderRadius: 999,
              backgroundColor: colors.mediaControl,
              paddingHorizontal: 12,
              paddingVertical: 7,
              maxWidth: '86%',
            }}
            pointerEvents="none"
          >
            <Copy size={12} weight="600" tone="onMedia" numberOfLines={1}>
              {specs.join(' · ')}
            </Copy>
          </View>
        )}
        {(listing || demoListing) && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 12,
              bottom: 12,
              backgroundColor: colors.mediaControl,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 14,
              borderWidth: 0.75,
              borderColor: colors.heroBorder,
            }}
          >
            <Copy size={11} tone="onMedia">
              {listing ? 'Preço anunciado' : 'Preço ilustrativo'}
            </Copy>
            <Copy tone="mediaAccent" style={feedTypography.price}>
              {listing ? moneyWithCents(listing.price) : money(demoListing.price)}
            </Copy>
          </View>
        )}
      </View>
      <View style={{ padding: 16, gap: 8 }}>
        <Copy tone="accentText" style={feedTypography.tag}>
          {listing ? 'VITRINE DO EXPLORAR' : (post.tag || 'COMUNIDADE').toUpperCase()}
        </Copy>
        <Copy style={feedTypography.title}>{title}</Copy>
        {!!description && (
          <Copy tone="text" style={feedTypography.body} numberOfLines={expanded ? undefined : 3}>
            {description}
          </Copy>
        )}
        {description.length > 145 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Recolher descrição' : 'Expandir descrição'}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((value) => !value)}
            style={{ minHeight: 32, alignSelf: 'flex-start', justifyContent: 'center' }}
          >
            <Copy weight="600" size={13} tone="accentText">
              {expanded ? 'Ver menos' : 'Ver mais'}
            </Copy>
          </Pressable>
        )}
        {listing && specs.length > 0 && (
          <Copy tone="muted" size={12}>
            {specs.join('  ·  ')}
          </Copy>
        )}
      </View>
      <View
        style={{
          borderTopWidth: hairline,
          borderColor: colors.border,
          paddingHorizontal: 10,
          paddingVertical: 6,
          gap: 6,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {listing ? (
          <EngagementButton
            icon={favorite ? 'bookmark' : 'bookmark-outline'}
            label={
              favorite ? 'Remover anúncio dos favoritos da conta' : 'Salvar anúncio na minha conta'
            }
            selected={favorite}
            onPress={toggleListingFavorite}
          />
        ) : (
          <>
            <EngagementButton
              icon={liked ? 'heart' : 'heart-outline'}
              label={`Curtir ${title}`}
              count={post.isRemote ? post.likesCount : post.likes + (liked ? 1 : 0)}
              selected={liked}
              onPress={() => act(onLike, () => dispatch({ type: 'liked', id: post.id }))}
            />
            <EngagementButton
              icon="chatbubble-outline"
              label={`Comentários de ${title}`}
              count={post.isRemote ? post.commentsCount : post.comments?.length || 0}
              onPress={() => router.push(`/comments/${post.id}`)}
            />
            <EngagementButton
              icon={saved ? 'bookmark' : 'bookmark-outline'}
              label={`Salvar ${title}`}
              selected={saved}
              onPress={() => act(onSave, () => dispatch({ type: 'saved', id: post.id }))}
            />
          </>
        )}
        <EngagementButton
          icon="share-social-outline"
          label={`Compartilhar ${title}`}
          onPress={share}
        />
        <View style={{ flex: 1 }} />
        {!!target && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listing ? `Ver anúncio ${title}` : `Tenho interesse em ${title}`}
            onPress={() => router.push(target)}
            style={{
              minHeight: 40,
              borderRadius: 999,
              backgroundColor: colors.accent,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 14,
              gap: 6,
            }}
          >
            <Copy tone="onAccent" style={feedTypography.action}>
              {listing ? 'Tenho interesse' : 'Ver anúncio'}
            </Copy>
            <Icon name="arrow-forward" size={15} color={colors.onAccent} />
          </Pressable>
        )}
      </View>
      {!!shareFeedback && (
        <Copy size={12} tone="muted" style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          {shareFeedback}
        </Copy>
      )}
    </View>
  );
}
