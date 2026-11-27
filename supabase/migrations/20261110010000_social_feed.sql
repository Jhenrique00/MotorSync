-- MOTORSYNC: applied to motorsync-dev on 2026-11-10 as remote migration 20261110053139_social_feed.
-- Keep as schema reference; DO NOT apply a second time (local filename differs from remote history).
-- A separate public social feed. Never exposes CRM, sales, costs, or private profiles.
begin;

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 80),
  title text not null default '' check (char_length(title) <= 90),
  body text not null default '' check (char_length(body) <= 1000),
  image_path text,
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint social_posts_not_empty check (
    char_length(btrim(title)) > 0 or char_length(btrim(body)) > 0 or image_path is not null
  ),
  constraint social_posts_image_owner check (
    image_path is null or (
      image_path ~ '^user/[0-9a-f-]{36}/[0-9a-z-]+\.(jpg|png|webp)$'
      and image_path like ('user/' || user_id::text || '/%')
    )
  )
);
create index social_posts_latest_idx on public.social_posts(created_at desc, id);
create index social_posts_author_idx on public.social_posts(user_id, created_at desc);
alter table public.social_posts enable row level security;
revoke all on public.social_posts from public, anon, authenticated;
grant select on public.social_posts to anon, authenticated;
grant insert (user_id, author_name, title, body, image_path, listing_id) on public.social_posts to authenticated;
grant update (author_name, title, body, image_path, listing_id) on public.social_posts to authenticated;
grant delete on public.social_posts to authenticated;

create policy social_posts_read on public.social_posts for select to anon, authenticated using (true);
-- Cross-module linking is only allowed to published listings owned by the author or
-- by an organization of which the author is an authorized member.
create policy social_posts_insert on public.social_posts for insert to authenticated with check (
  user_id = (select auth.uid())
  and (
    listing_id is null or exists (
      select 1 from public.listings listing
      where listing.id = social_posts.listing_id
        and listing.publication_status = 'published'
        and (
          listing.owner_user_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members membership
            where membership.organization_id = listing.organization_id
              and membership.user_id = (select auth.uid())
              and membership.role in ('owner','manager','seller')
          )
        )
    )
  )
);
create policy social_posts_update on public.social_posts for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    listing_id is null or exists (
      select 1 from public.listings listing
      where listing.id = social_posts.listing_id
        and listing.publication_status = 'published'
        and (
          listing.owner_user_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members membership
            where membership.organization_id = listing.organization_id
              and membership.user_id = (select auth.uid())
              and membership.role in ('owner','manager','seller')
          )
        )
    )
  )
);
create policy social_posts_delete on public.social_posts for delete to authenticated
using (user_id = (select auth.uid()));

create table public.social_post_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index social_post_likes_by_user_idx on public.social_post_likes(user_id, created_at desc);
alter table public.social_post_likes enable row level security;
revoke all on public.social_post_likes from public, anon, authenticated;
grant select, insert, delete on public.social_post_likes to authenticated;
create policy social_likes_read on public.social_post_likes for select to authenticated using (true);
create policy social_likes_insert on public.social_post_likes for insert to authenticated
with check (user_id = (select auth.uid()));
create policy social_likes_delete on public.social_post_likes for delete to authenticated
using (user_id = (select auth.uid()));

create table public.social_post_saves (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index social_post_saves_by_user_idx on public.social_post_saves(user_id, created_at desc);
alter table public.social_post_saves enable row level security;
revoke all on public.social_post_saves from public, anon, authenticated;
grant select, insert, delete on public.social_post_saves to authenticated;
create policy social_saves_read on public.social_post_saves for select to authenticated
using (user_id = (select auth.uid()));
create policy social_saves_insert on public.social_post_saves for insert to authenticated
with check (user_id = (select auth.uid()));
create policy social_saves_delete on public.social_post_saves for delete to authenticated
using (user_id = (select auth.uid()));

create table public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 80),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  parent_id uuid references public.social_post_comments(id) on delete set null,
  created_at timestamptz not null default now()
);
create index social_comments_by_post_idx on public.social_post_comments(post_id, created_at);
create index social_comments_by_user_idx on public.social_post_comments(user_id, created_at desc);
alter table public.social_post_comments enable row level security;
revoke all on public.social_post_comments from public, anon, authenticated;
grant select on public.social_post_comments to anon, authenticated;
grant insert (post_id, user_id, author_name, body, parent_id) on public.social_post_comments to authenticated;
grant delete on public.social_post_comments to authenticated;
create policy social_comments_read on public.social_post_comments for select to anon, authenticated using (true);
create policy social_comments_insert on public.social_post_comments for insert to authenticated
with check (
  user_id = (select auth.uid()) and (
    parent_id is null or exists (
      select 1 from public.social_post_comments parent
      where parent.id = social_post_comments.parent_id
        and parent.post_id = social_post_comments.post_id
    )
  )
);
create policy social_comments_delete on public.social_post_comments for delete to authenticated
using (user_id = (select auth.uid()));

-- Public media means only photos intended for publication can be stored here.
-- All uploads are restricted to the authenticated user's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-post-images', 'social-post-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
) on conflict (id) do nothing;
create policy social_image_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'social-post-images'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and name ~ '^user/[0-9a-f-]{36}/[0-9a-z-]+\.(jpg|png|webp)$'
);
create policy social_image_remove on storage.objects for delete to authenticated
using (
  bucket_id = 'social-post-images'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

commit;
