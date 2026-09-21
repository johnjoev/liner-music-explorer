'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Something went wrong.</h1>
        <p>Please try loading the workspace again.</p>
        <button className="primary-button" onClick={reset} style={{ marginTop: 24 }}>
          Try again
        </button>
      </section>
    </main>
  );
}
