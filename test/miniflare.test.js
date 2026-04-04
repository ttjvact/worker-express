import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, 'fixtures', 'integration-worker.mjs');

let mf;

before(async () => {
  mf = new Miniflare({
    // 目的: dist ビルド済み Worker を Miniflare で起動し、Workers 実行を node:test から再現する。
    // 処理: modules 形式の entrypoint を読み込み、dispatchFetch で結合テスト可能にする。
    scriptPath: fixturePath,
    modules: true,
    modulesRules: [{ type: 'ESModule', include: ['**/*.js'] }],
    compatibilityDate: '2025-01-01',
  });
});

after(async () => {
  await mf?.dispose();
});

// 検証対象: 最小サンプルのルーティングが Miniflare 上でも 200 と本文を返す処理。
test('Miniflare serves the hello-world route', async () => {
  const response = await mf.dispatchFetch('http://localhost/');

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Hello from Miniflare');
});

// 検証対象: middleware と route handler が Workers 実行でも連携し、params と query を参照できる処理。
test('Miniflare preserves middleware, req.params, and req.query', async () => {
  const response = await mf.dispatchFetch('http://localhost/users/42?q=worker-express');

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-middleware'), 'ran');
  assert.deepEqual(await response.json(), {
    id: '42',
    q: 'worker-express',
    requestId: 'mf-request',
  });
});

// 検証対象: `next(err)` が Workers 実行でも 500 応答へフォールバックする処理。
test('Miniflare converts next(err) into a 500 response', async () => {
  const response = await mf.dispatchFetch('http://localhost/error');

  assert.equal(response.status, 500);
  assert.equal(await response.text(), 'Internal Server Error');
});
