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


// 検証対象: GET リクエストでは本文を解析せず req.body を undefined にする処理。
test('GET request keeps req.body undefined', async () => {
  const app = express();

  app.get('/body-check', (req, res) => {
    res.json({ hasBody: req.body !== undefined });
  });

  const response = await app.fetch(new Request('https://example.com/body-check'));

  assert.deepEqual(await response.json(), { hasBody: false });
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

// 検証対象: ルート一致後に next() のみで応答未送信の場合、fallthrough を 404 に寄せる処理。
test('fallthrough after matched route returns 404', async () => {
  const app = express();

  app.get('/fallthrough', (req, res, next) => next());

  const response = await app.fetch(new Request('https://example.com/fallthrough'));

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not Found');
});

// 検証対象: send 後に status/set を呼んでも確定済みレスポンス状態が変わらない処理。
test('status/set after send does not mutate finalized response', async () => {
  const app = express();

  app.get('/frozen-send', (req, res) => {
    res.send('locked');
    res.status(201).set('x-late', 'ignored');
  });

  const response = await app.fetch(new Request('https://example.com/frozen-send'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-late'), null);
  assert.equal(await response.text(), 'locked');
});

// 検証対象: json 実行前に content-type が設定済みなら上書きせずに維持する処理。
test('json keeps pre-set content-type header', async () => {
  const app = express();

  app.get('/json-content-type', (req, res) => {
    res.set('content-type', 'application/problem+json');
    res.json({ ok: true });
  });

  const response = await app.fetch(new Request('https://example.com/json-content-type'));

  assert.equal(response.headers.get('content-type'), 'application/problem+json');
  assert.deepEqual(await response.json(), { ok: true });
});

// 検証対象: end は低レベル API として暗黙の content-type 補完を行わない処理。
test('end does not infer content-type automatically', async () => {
  const app = express();

  app.get('/end-raw', (req, res) => {
    res.end(new Uint8Array([112, 108, 97, 105, 110]));
  });

  const response = await app.fetch(new Request('https://example.com/end-raw'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), null);
  assert.equal(await response.text(), 'plain');
});

// 検証対象: end 後に status/set を呼んでもヘッダとステータスが変わらない処理。
test('status/set after end does not mutate finalized response', async () => {
  const app = express();

  app.get('/frozen-end', (req, res) => {
    res.status(202).end('done');
    res.status(204).set('x-late', 'ignored');
  });

  const response = await app.fetch(new Request('https://example.com/frozen-end'));

  assert.equal(response.status, 202);
  assert.equal(response.headers.get('x-late'), null);
  assert.equal(await response.text(), 'done');
});

// 検証対象: 異常系として next(err) が統一 500 応答へ変換される処理。
test('next(err) returns 500', async () => {
  const app = express();

  app.use((req, res, next) => next(new Error('boom')));
  app.get('/', (req, res) => res.send('never'));

  const response = await app.fetch(new Request('https://example.com/'));

  assert.equal(response.status, 500);
});
