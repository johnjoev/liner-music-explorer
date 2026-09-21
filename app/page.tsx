import { redirect } from 'next/navigation';
import { isConfigured, serverClient } from '@/lib/supabase';
import Dashboard from '@/components/dashboard';
import { localPreviewEnabled } from '@/lib/local-preview';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (localPreviewEnabled()) return <Dashboard preview />;
  if (!isConfigured()) return <Dashboard setup />;
  const client = await serverClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <Dashboard email={data.user.email} />;
}
