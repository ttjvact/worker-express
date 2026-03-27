import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../dist/index.js';

// 検証対象: 正常系として GET / が 200 と本文を返す処理。
test('GET / returns 200 and body', async () => {
  const app = express();
  app.get('/', (req, res) => res.send('Hello'));

  const response = await app.fetch(new Request('https://example.com/'));

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Hello');
});

// 検証対象: 未定義ルートで 404 を返す処理。
test('unknown route returns 404', async () => {
  const app = express();
  app.get('/known', (req, res) => res.send('ok'));

  const response = await app.fetch(new Request('https://example.com/unknown'));

  assert.equal(response.status, 404);
});

// 検証対象: 404 になる場合でも app.use ミドルウェアが先に実行される処理。
test('unknown route still runs app.use middleware before 404', async () => {
  const app = express();
  let middlewareRan = false;

  app.use((req, res, next) => {
    middlewareRan = true;
    return next();
  });

  const response = await app.fetch(new Request('https://example.com/unknown'));

  assert.equal(middlewareRan, true);
  assert.equal(response.status, 404);
});

// 検証対象: `:param` パターンから req.params を構築する処理。
test('req.params is populated for :param', async () => {
  const app = express();
  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));

  const response = await app.fetch(new Request('https://example.com/users/42'));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: '42' });
});

// 検証対象: クエリ文字列を req.query へデコードして格納する処理。
test('req.query is parsed', async () => {
  const app = express();
  app.get('/search', (req, res) => res.json(req.query));

  const response = await app.fetch(new Request('https://example.com/search?q=worker%20express&page=2'));

  assert.deepEqual(await response.json(), { q: 'worker express', page: '2' });
});

// 検証対象: application/json のリクエスト本文を req.body へ反映する処理。
test('JSON body is parsed into req.body', async () => {
  const app = express();
  app.post('/echo', (req, res) => res.json(req.body));

  const response = await app.fetch(
    new Request('https://example.com/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    }),
  );

  assert.deepEqual(await response.json(), { ok: true });
});

// 検証対象: 複数ミドルウェアとルートハンドラの実行順序を維持する処理。
test('middleware execution order', async () => {
  const app = express();
  const order = [];

  app.use((req, res, next) => {
    order.push('m1');
    return next();
  });

  app.use((req, res, next) => {
    order.push('m2');
    return next();
  });

  app.get('/order', (req, res) => {
    order.push('handler');
    res.json(order);
  });

  const response = await app.fetch(new Request('https://example.com/order'));

  assert.deepEqual(await response.json(), ['m1', 'm2', 'handler']);
});

// 検証対象: ルート内で next() した fallthrough が 204 / 空本文になる処理。
test('fallthrough returns a valid 204 response with no body', async () => {
  const app = express();

  app.get('/fallthrough', (req, res, next) => next());

  const response = await app.fetch(new Request('https://example.com/fallthrough'));

  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
});

// 検証対象: 異常系として next(err) が統一 500 応答へ変換される処理。
test('next(err) returns 500', async () => {
  const app = express();

  app.use((req, res, next) => next(new Error('boom')));
  app.get('/', (req, res) => res.send('never'));

  const response = await app.fetch(new Request('https://example.com/'));

  assert.equal(response.status, 500);
});
