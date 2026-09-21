import { redirect } from 'next/navigation';
import { isConfigured, serverClient } from '@/lib/supabase';
import AuthForm from '@/components/auth-form';
export const dynamic = 'force-dynamic';
export default async function Login() {
  if (isConfigured()) {
    const client = await serverClient();
    const { data } = await client.auth.getUser();
    if (data.user) redirect('/');
  }
  return <AuthForm configured={isConfigured()} />;
}
