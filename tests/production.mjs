import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
// Run after npm run build. A preview flag must never bypass production authentication.
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3001'],
  {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      LOCAL_PREVIEW: 'true',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
    },
  },
);
let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk;
});
child.stderr.on('data', (chunk) => {
  output += chunk;
});
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(output);
    try {
      if ((await fetch('http://127.0.0.1:3001')).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Production server must start');
  const response = await fetch('http://127.0.0.1:3001/api/catalogue');
  assert.equal(response.status, 503);
  const html = await (await fetch('http://127.0.0.1:3001')).text();
  assert.ok(html.includes('No database is connected yet.'));
  assert.ok(!html.includes('Explore all 3,503 tracks.'));
  assert.equal(
    (
      await fetch('http://127.0.0.1:3001/auth/signout', {
        method: 'POST',
        headers: { Origin: 'https://example.com' },
        redirect: 'manual',
      })
    ).status,
    403,
  );
  console.log(
    'Production checks passed: no local-preview bypass; unconfigured API fails closed; cross-origin sign-out rejected.',
  );
} finally {
  child.kill();
}
