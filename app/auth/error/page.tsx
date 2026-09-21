export default function AuthError() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>That link didn’t work.</h1>
        <p>
          The confirmation link may have expired or already been used. Return to sign in, or create
          your account again to request a new confirmation email.
        </p>
        <a className="auth-back" href="/login">
          Return to sign in
        </a>
      </section>
    </main>
  );
}
