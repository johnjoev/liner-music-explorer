import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, serverClient } from '@/lib/supabase';
import { localPreviewEnabled, previewCatalogue } from '@/lib/local-preview';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const preview = localPreviewEnabled();
  if (!preview && !isConfigured())
    return NextResponse.json(
      { error: 'Connect Supabase to explore the catalogue.' },
      { status: 503, headers },
    );
  const client = preview ? null : await serverClient();
  if (client) {
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user)
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401, headers });
  }
  const params = request.nextUrl.searchParams;
  const ids = (name: string) => {
    const raw = params.get(name);
    if (!raw) return [];
    const values = raw.split(',');
    if (values.length > 500 || values.some((v) => !/^\d{1,9}$/.test(v) || Number(v) < 1))
      throw new Error('Invalid filter.');
    return [...new Set(values.map(Number))];
  };
  try {
    const q = (params.get('q') ?? '').trim();
    const page = Number(params.get('page') ?? '1');
    const size = Number(params.get('size') ?? '20');
    if (
      q.length > 200 ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 1000000 ||
      ![10, 20, 50].includes(size)
    )
      throw new Error('Invalid search or page.');
    const args = {
      q,
      genre_ids: ids('genres'),
      artist_ids: ids('artists'),
      album_ids: ids('albums'),
      page_number: page,
      page_size: size,
    };
    if (preview) return NextResponse.json(await previewCatalogue(args), { headers });
    const { data, error } = await client!.rpc('explore_catalogue', args);
    if (error) {
      console.error('Catalogue RPC failed:', error.code);
      return NextResponse.json(
        { error: 'The catalogue could not be loaded. Please retry.' },
        { status: 500, headers },
      );
    }
    return NextResponse.json(data, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Invalid search or filter parameters.' },
      { status: 400, headers },
    );
  }
}
