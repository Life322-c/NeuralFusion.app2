// Signs in as a NORMAL (non-admin) test user and confirms privilege escalation is blocked.
// Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... TEST_EMAIL=... TEST_PASSWORD=... npm run rls-test
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD } = process.env;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data, error } = await sb.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
if (error) throw error;
const uid = data.user.id;
let failed = 0;
const expectBlocked = (label, err) => { if (err) console.log('PASS (blocked):', label); else { failed++; console.log('FAIL (allowed):', label); } };

expectBlocked('set own is_pro', (await sb.from('profiles').update({ is_pro: true }).eq('id', uid)).error);
expectBlocked('set own is_enterprise', (await sb.from('profiles').update({ is_enterprise: true }).eq('id', uid)).error);
expectBlocked('set own is_admin', (await sb.from('profiles').update({ is_admin: true }).eq('id', uid)).error);
expectBlocked('write pro_price', (await sb.from('platform_settings').upsert({ key: 'pro_price', value: 100 }, { onConflict: 'key' })).error);
expectBlocked('insert payments row', (await sb.from('payments').insert({ reference: 'x_' + Date.now(), user_id: uid, plan: 'pro', status: 'completed' })).error);

const { data: row } = await sb.from('profiles').select('is_pro,is_enterprise,is_admin').eq('id', uid).maybeSingle();
console.log('Profile flags now:', row);
process.exit(failed ? 1 : 0);
