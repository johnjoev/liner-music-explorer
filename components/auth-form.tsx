'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Disc3 } from 'lucide-react';
export default function AuthForm({ configured }: { configured: boolean }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError(false);
    try {
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      if (signup) {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign('/');
          return;
        }
        setMessage('Check your email for a confirmation link, then return here to sign in.');
        setPassword('');
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        window.location.assign('/');
      }
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : 'Could not sign in. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="brand">
          <Disc3 size={32} />
          <span>liner.</span>
        </a>
        <h1>{signup ? 'Make room for discovery.' : 'Welcome back.'}</h1>
        <p>
          {signup
            ? 'Create an account to explore the collection.'
            : 'Sign in to find your next great discovery.'}
        </p>
        {!configured && (
          <p className="auth-message auth-note">
            Authentication will be available after Supabase is connected.
          </p>
        )}
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!configured || busy}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={signup ? 8 : 1}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured || busy}
            />
          </label>
          {signup && <span className="muted">Use at least 8 characters.</span>}
          {message && (
            <p
              role={error ? 'alert' : 'status'}
              className={`auth-message ${error ? 'auth-error' : ''}`}
            >
              {message}
            </p>
          )}
          <button className="primary-button" disabled={!configured || busy}>
            {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <button
          className="auth-toggle"
          disabled={busy}
          onClick={() => {
            setSignup(!signup);
            setMessage('');
            setPassword('');
          }}
        >
          {signup ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
        <p className="auth-note">Music data from the Chinook sample database.</p>
        {!configured && (
          <a className="auth-back" href="/">
            Back to workspace preview
          </a>
        )}
      </section>
    </main>
  );
}
