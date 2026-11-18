import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const origin = 'http://127.0.0.1:8793';
const consent = '2026-11-19-v1';
const admin = 'local-analytics-admin-test-value';
const post = (path, body, headers = {}) => fetch(origin + '/api/analytics/' + path, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const report = async () => {
  const r = await fetch(origin + '/api/analytics/report', { headers: { authorization: 'Bearer ' + admin } });
  assert.equal(r.status, 200); return r.json();
};
assert.equal((await fetch(origin + '/api/analytics/report')).status, 401);
assert.equal((await post('session', {consent}, {origin:'https://foreign.example'})).status, 403);
assert.equal((await post('session', {})).status, 400);
assert.equal((await post('session', {consent}, {dnt:'1'})).status, 204);
assert.equal((await post('session', {consent}, {'sec-gpc':'1'})).status, 204);
assert.equal((await post('events', {consent,token:'invalid',events:[]})).status, 401);
const start = await report();
const created = await post('session', {consent});
assert.equal(created.status, 200);
const {token} = await created.json();
assert.equal((await report()).totals.events, start.totals.events, 'session issuance stores no visit');
const id = () => randomUUID().replaceAll('-','');
const events = [
  {id:id(),name:'page_view',path:'/?email=private@example.org',target:'private@example.org',language:'de'},
  {id:id(),name:'beta_click',path:'/news/launch?secret=private',target:'hero_beta',language:'de'},
  {id:id(),name:'scroll',path:'/private/account-123',value:900},
];
const body = {consent,token,attribution:{source:'integration-test',medium:'qa',campaign:'private@example.org'},events};
assert.equal((await post('events', body)).status, 200);
assert.equal((await post('events', body)).status, 200);
assert.equal((await post('events', {...body,token:token+'.extra'})).status, 401);
assert.equal((await post('events', {...body,events:[{id:id(),name:'secret_form_contents'}]})).status, 400);
const result = await report();
assert.equal(result.totals.events - start.totals.events, 3, 'retries deduplicate');
assert.equal(result.totals.sessions - start.totals.sessions, 1);
assert.equal(result.totals.beta_sessions - start.totals.beta_sessions, 1);
assert.ok(result.pages.some(p => p.path === '/other'));
assert.ok(result.events.some(e => e.name === 'scroll' && e.value === 100));
assert.ok(result.campaigns.some(c => c.source === 'integration-test' && c.campaign === ''));
assert.ok(!JSON.stringify(result).includes('private@example.org'));
assert.ok(!JSON.stringify(result).includes('account-123'));
console.log('Analytics integration checks passed: authorization, origin, consent, privacy signals, signed sessions, deduplication, validation, aggregation and URL sanitization. Local database only.');
