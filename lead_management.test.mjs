// Logic tests for the Admin > Leads helpers (copy text, validation, error mapping, CSV safety).
// Run: NODE_PATH=<dir containing react> node tests/lead_management.test.mjs
// Does NOT test: real clipboard, real Supabase, real browser clicks.
import fs from 'node:fs'; import vm from 'node:vm'; import { createRequire } from 'node:module'; import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const React = require(process.env.REACT_PATH || 'react');
const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const m = src.split('// === NEURALFUSION_LEADS_MODULE_START ===')[1].split('// === NEURALFUSION_LEADS_MODULE_END ===')[0];
const win = { isSecureContext: true }; let copied = null;
const ctx = { React, window: win, sb: {}, document: {}, navigator: { clipboard: { writeText: async (t) => { copied = t; } } }, console, setTimeout, clearTimeout, setInterval, clearInterval };
ctx.window = Object.assign(win, ctx); vm.createContext(ctx); vm.runInContext(m, ctx);
const T = win.NF_LEADS.__test; let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS', name); };

const lead = { id: 'abc', full_name: 'John Smith', email: 'john@example.com', organisation: 'Example Technologies', position: 'Managing Director', country: 'United Kingdom',
  lead_category: 'corporate', enquiry_type: 'Organisational Programme', team_size: 50, message: 'We are interested in a programme.', source_page: 'organisations', created_at: '2026-11-08T10:00:00Z', status: 'new', internal_notes: 'SECRET' };
ok('details text uses the record and the agreed layout', () => {
  const t = T.leadDetailsText(lead);
  assert.ok(t.startsWith('NEURALFUSION LEAD DETAILS\n\nName: John Smith\nEmail: john@example.com\n'));
  for (const s of ['Organisation: Example Technologies', 'Position: Managing Director', 'Country: United Kingdom', 'Category: Corporate', 'Enquiry Type: Organisational Programme', 'Team Size: 50', 'Message:\nWe are interested in a programme.', 'Source: organisations', 'Status: New']) assert.ok(t.includes(s), s);
  assert.ok(!t.includes('SECRET'), 'internal notes must not be copied');
});
ok('optional empty fields are omitted, never placeholders', () => {
  const t = T.leadDetailsText({ id: 1, full_name: 'A B', email: 'a@b.co', lead_category: 'general', message: 'Hi', status: 'contacted', created_at: '2026-11-08T10:00:00Z', organisation: '', team_size: null });
  assert.ok(!/Organisation|Team Size|Phone|Position|undefined|null/.test(t), t);
});
ok('phone appears when present', () => assert.ok(T.leadDetailsText(Object.assign({}, lead, { phone: '+234 800 000 0000' })).includes('Phone: +234 800 000 0000')));
ok('validation: required fields and email', () => {
  assert.deepEqual(Object.keys(T.validateLead({ full_name: ' ', email: '', message: '', lead_category: '', status: '' })).sort(), ['email', 'full_name', 'lead_category', 'message', 'status']);
  assert.ok(T.validateLead({ full_name: 'A', email: 'not-an-email', message: 'x', lead_category: 'general', status: 'new' }).email);
  assert.ok(T.validateLead({ full_name: 'A', email: 'a b@c.com', message: 'x', lead_category: 'general', status: 'new' }).email);
  assert.equal(Object.keys(T.validateLead({ full_name: 'A', email: 'a@b.co', message: 'x', lead_category: 'general', status: 'new' })).length, 0);
});
ok('error mapping', () => {
  assert.match(T.friendlyError({ message: 'not_authorised' }, 'delete this lead'), /permission/);
  assert.match(T.friendlyError({ message: 'function public.admin_edit_business_lead does not exist' }, 'save'), /migration_lead_management\.sql/);
  assert.match(T.friendlyError({ message: 'lead_not_found' }, 'x'), /no longer exists/);
});
ok('csv formula injection protection retained', () => assert.equal(T.csvCell('=1+1'), '"\'=1+1"'));
await T.copyText('hello'); assert.equal(copied, 'hello'); n++; console.log('PASS modern clipboard path');
console.log(n + ' checks passed');
