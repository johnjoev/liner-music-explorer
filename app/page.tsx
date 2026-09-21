import { redirect } from 'next/navigation';
import { isConfigured, serverClient } from '@/lib/supabase';
import Dashboard from '@/components/dashboard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (!isConfigured()) return <Dashboard setup />;
  const client = await serverClient();
  const {data, error} = await client.auth.getUser();
  if (error || !data.user) redirect('/login');
  return <Dashboard email={data.user.email} />;
}
