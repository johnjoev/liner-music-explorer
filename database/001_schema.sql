-- Run in Supabase SQL Editor, before 002_seed.sql.
begin;
create table if not exists public.tracks (
 id integer primary key, title text not null, artist_id integer not null,
 artist text not null, album_id integer not null, album text not null,
 genre_id integer not null, genre text not null, composer text,
 milliseconds integer not null check (milliseconds > 0), price numeric(10,2) not null
);
create index if not exists tracks_facets on public.tracks(genre_id, artist_id, album_id);
alter table public.tracks enable row level security;
drop policy if exists "Authenticated catalogue reads" on public.tracks;
create policy "Authenticated catalogue reads" on public.tracks for select to authenticated using (true);
revoke all on public.tracks from anon, authenticated;
grant select on public.tracks to authenticated;

-- Invoker security keeps the caller's RLS restrictions active.
-- OR within a facet, AND across facets. Search is literal, not SQL pattern syntax.
create or replace function public.explore_catalogue(
 q text default '', genre_ids integer[] default '{}', artist_ids integer[] default '{}',
 album_ids integer[] default '{}', page_number integer default 1, page_size integer default 20
) returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare result jsonb; n bigint; p integer; size integer; pages integer;
begin
 size := case when page_size in (10,20,50) then page_size else 20 end;
 select count(*) into n from tracks t
 where (coalesce(q,'') = '' or strpos(lower(concat_ws(' ', t.title,t.artist,t.album,t.composer)),lower(q)) > 0)
 and (coalesce(cardinality(genre_ids),0)=0 or t.genre_id=any(genre_ids))
 and (coalesce(cardinality(artist_ids),0)=0 or t.artist_id=any(artist_ids))
 and (coalesce(cardinality(album_ids),0)=0 or t.album_id=any(album_ids));
 pages := greatest(1,ceil(n::numeric/size)::integer);
 p := least(greatest(coalesce(page_number,1),1),pages);
 with searched as (
 select * from tracks
 ), genre_filtered as (
 select * from searched t where coalesce(cardinality(genre_ids),0)=0 or t.genre_id=any(genre_ids)
 ), artist_filtered as (
 select * from genre_filtered t where coalesce(cardinality(artist_ids),0)=0 or t.artist_id=any(artist_ids)
 ), filtered as (
 select * from artist_filtered t where (coalesce(cardinality(album_ids),0)=0 or t.album_id=any(album_ids))
 and (coalesce(q,'')='' or strpos(lower(concat_ws(' ',t.title,t.artist,t.album,t.composer)),lower(q))>0)
 ), page_rows as (
 select id,title,artist,album,genre,composer,milliseconds,price from filtered order by lower(title),id limit size offset (p-1)*size
 ), genre_options as (select distinct genre_id id,genre name from searched),
 artist_options as (select distinct artist_id id,artist name from genre_filtered),
 album_options as (select distinct album_id id,album || ' — ' || artist name from artist_filtered),
 distribution as (select genre name,count(*) count from filtered group by genre order by count(*) desc,genre limit 5)
 select jsonb_build_object(
 'tracks',coalesce((select jsonb_agg(to_jsonb(r)) from page_rows r),'[]'::jsonb),
 'total',n,'page',p,'pages',pages,
 'genres',coalesce((select jsonb_agg(to_jsonb(o) order by o.name) from genre_options o),'[]'::jsonb),
 'artists',coalesce((select jsonb_agg(to_jsonb(o) order by o.name) from artist_options o),'[]'::jsonb),
 'albums',coalesce((select jsonb_agg(to_jsonb(o) order by o.name) from album_options o),'[]'::jsonb),
 'stats',(select jsonb_build_object('artists',count(distinct artist_id),'albums',count(distinct album_id),'minutes',coalesce(round(sum(milliseconds)/60000.0),0)) from filtered),
 'distribution',coalesce((select jsonb_agg(to_jsonb(d)) from distribution d),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.explore_catalogue(text,integer[],integer[],integer[],integer,integer) from public,anon;
grant execute on function public.explore_catalogue(text,integer[],integer[],integer[],integer,integer) to authenticated;
commit;
