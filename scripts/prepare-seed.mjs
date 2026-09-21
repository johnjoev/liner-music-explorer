import { readFile, writeFile, mkdir } from 'node:fs/promises';
// Build a music-only import. Never execute the upstream DROP/CREATE DATABASE commands.
const source = await readFile(new URL('../chinook-source.sql', import.meta.url), 'utf8');
const tables = ['artist', 'album', 'genre', 'track'];
const statements = [];
for (const table of tables) {
  const schema = source.match(new RegExp(`CREATE TABLE ${table}\\s*\\([\\s\\S]*?\\n\\);`))?.[0];
  if (!schema) throw new Error(`Missing schema: ${table}`);
  statements.push(
    schema
      .replace(`CREATE TABLE ${table}`, `CREATE TEMP TABLE seed_${table}`)
      .replace(/CONSTRAINT \w+ PRIMARY KEY/g, 'PRIMARY KEY'),
  );
  // PostgreSQL strings may contain semicolons, so terminate only at a tuple's closing line.
  const inserts = [
    ...source.matchAll(
      new RegExp(
        `INSERT INTO ${table} \\([^\\n]+\\) VALUES\\r?\\n[\\s\\S]*?\\);(?=\\r?\\n|$)`,
        'g',
      ),
    ),
  ];
  if (!inserts.length) throw new Error(`Missing data: ${table}`);
  statements.push(
    ...inserts.map((m) => m[0].replace(`INSERT INTO ${table}`, `INSERT INTO seed_${table}`)),
  );
}
const output = `-- Chinook v1.4.5 by Luis Rocha; MIT license in CHINOOK_LICENSE.md.\n-- Music-only import; safe to rerun. Run after 001_schema.sql.\nbegin;\n${statements.join('\n\n')}\n
insert into public.tracks (id,title,artist_id,artist,album_id,album,genre_id,genre,composer,milliseconds,price)
select t.track_id,t.name,r.artist_id,r.name,a.album_id,a.title,g.genre_id,g.name,t.composer,t.milliseconds,t.unit_price
from seed_track t join seed_album a using(album_id) join seed_artist r using(artist_id) join seed_genre g using(genre_id)
on conflict(id) do update set title=excluded.title,artist_id=excluded.artist_id,artist=excluded.artist,album_id=excluded.album_id,album=excluded.album,genre_id=excluded.genre_id,genre=excluded.genre,composer=excluded.composer,milliseconds=excluded.milliseconds,price=excluded.price;
drop table seed_track,seed_album,seed_artist,seed_genre;
commit;\n`;
await mkdir(new URL('../database/', import.meta.url), { recursive: true });
await writeFile(new URL('../database/002_seed.sql', import.meta.url), output);
console.log('Created music-only seed SQL.');
