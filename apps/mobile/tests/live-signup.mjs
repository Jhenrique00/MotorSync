import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split('=')),
);
const client = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const file = '.env.auth-test';
const account = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, 'utf8'))
  : { email: 'jhcamelogomes@gmail.com', password: crypto.randomBytes(30).toString('base64url') };
fs.writeFileSync(file, JSON.stringify(account));
const { data, error } = await client.auth.signUp(account);
if (error) {
  console.log(JSON.stringify({ ok: false, code: error.code, message: error.message }));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      ok: true,
      confirmationRequired: !data.session,
      userReturned: !!data.user,
      identities: data.user?.identities?.length,
    }),
  );
}
