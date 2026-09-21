import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Catalogue } from './types';
// Development-only preview: production always requires cloud Postgres and authentication.
export function localPreviewEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.LOCAL_PREVIEW === 'true';
}
const globalDb = globalThis as unknown as { linerPreview?: Promise<PGlite> };
async function previewDb() {
  if (!localPreviewEnabled()) throw new Error('Local preview is disabled.');
  globalDb.linerPreview ??= (async () => {
    const db = new PGlite();
    await db.exec('create role anon; create role authenticated;');
    await db.exec(await readFile(path.join(process.cwd(), 'database/001_schema.sql'), 'utf8'));
    await db.exec(await readFile(path.join(process.cwd(), 'database/002_seed.sql'), 'utf8'));
    await db.exec('set role authenticated;');
    return db;
  })().catch((error) => {
    globalDb.linerPreview = undefined;
    throw error;
  });
  return globalDb.linerPreview;
}
export async function previewCatalogue(args: {
  q: string;
  genre_ids: number[];
  artist_ids: number[];
  album_ids: number[];
  page_number: number;
  page_size: number;
}) {
  const db = await previewDb();
  const result = await db.query<{ result: Catalogue }>(
    'select public.explore_catalogue($1,$2,$3,$4,$5,$6) result',
    [args.q, args.genre_ids, args.artist_ids, args.album_ids, args.page_number, args.page_size],
  );
  return result.rows[0].result;
}
