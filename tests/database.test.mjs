import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
before(async () => {
  await db.exec('create role anon; create role authenticated;');
  await db.exec(await readFile(new URL('../database/001_schema.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../database/002_seed.sql', import.meta.url), 'utf8'));
});
after(() => db.close());
async function query(q = '', genres = [], artists = [], albums = [], page = 1, size = 20) {
  const result = await db.query('select public.explore_catalogue($1,$2,$3,$4,$5,$6) result', [
    q,
    genres,
    artists,
    albums,
    page,
    size,
  ]);
  return result.rows[0].result;
}
test('imports all 3503 Chinook tracks with stable non-overlapping pages', async () => {
  const a = await query();
  const b = await query('', [], [], [], 2);
  assert.equal(a.total, 3503);
  assert.equal(a.tracks.length, 20);
  assert.equal(a.pages, 176);
  assert.equal(new Set([...a.tracks, ...b.tracks].map((t) => t.id)).size, 40);
  assert.equal(a.genres.length, 25);
  assert.equal(a.stats.albums, 347);
});
test('genre filters cascade into artist and album options', async () => {
  const all = await query();
  const rock = all.genres.find((g) => g.name === 'Rock');
  const narrowed = await query('', [rock.id]);
  assert.ok(narrowed.total < all.total);
  assert.ok(narrowed.artists.length < all.artists.length);
  const artist = narrowed.artists.find((a) => a.name === 'AC/DC');
  assert.ok(artist);
  const byArtist = await query('', [rock.id], [artist.id]);
  assert.equal(byArtist.total, 18);
  assert.ok(byArtist.albums.every((a) => a.name.includes('AC/DC')));
  const album = byArtist.albums[0];
  const byAlbum = await query('', [rock.id], [artist.id], [album.id]);
  assert.ok(byAlbum.total < byArtist.total);
  assert.ok(byAlbum.tracks.every((t) => t.artist === 'AC/DC'));
});
test('multi-select is OR within a filter and AND across filters', async () => {
  const rock = await query('', [1]);
  const jazz = await query('', [2]);
  const both = await query('', [1, 2]);
  assert.equal(both.total, rock.total + jazz.total);
  const impossible = await query('', [2], [1]);
  assert.equal(impossible.total, 0);
});
test('search covers titles, artists, albums and composers and treats symbols literally', async () => {
  for (const q of ['AC/DC', 'Let There Be Rock', 'For Those About To Rock', 'Angus Young'])
    assert.ok((await query(q)).total > 0);
  assert.equal((await query('ac/dc')).total, (await query('AC/DC')).total);
  assert.equal((await query("'; DROP TABLE tracks; --")).total, 0);
  assert.ok((await query('%')).total < 3503);
  assert.equal((await query('no-such-track-xyz')).total, 0);
  assert.equal((await query('AC/DC', [2])).total, 0);
});
test('pagination clamps bounds and honors allowed sizes', async () => {
  const last = await query('', [], [], [], 9999, 50);
  assert.equal(last.page, 71);
  assert.equal(last.tracks.length, 3);
  assert.equal((await query('', [], [], [], -10, 10)).page, 1);
  assert.equal((await query('', [], [], [], 1, 10000)).tracks.length, 20);
  const none = await query('no-such-track-xyz', [], [], [], 10);
  assert.equal(none.page, 1);
  assert.equal(none.pages, 1);
  assert.deepEqual(none.tracks, []);
});
test('seed is repeatable without duplicating records', async () => {
  await db.exec(await readFile(new URL('../database/002_seed.sql', import.meta.url), 'utf8'));
  assert.equal((await query()).total, 3503);
});
test('anonymous role cannot query tracks or call the RPC; authenticated role is read-only', async () => {
  await db.exec('set role anon');
  try {
    await assert.rejects(
      () => db.query('select * from public.tracks limit 1'),
      /permission denied/,
    );
    await assert.rejects(() => query(), /permission denied/);
  } finally {
    await db.exec('reset role');
  }
  await db.exec('set role authenticated');
  try {
    assert.equal((await query()).total, 3503);
    await assert.rejects(
      () => db.query('delete from public.tracks where id=1'),
      /permission denied/,
    );
  } finally {
    await db.exec('reset role');
  }
});
