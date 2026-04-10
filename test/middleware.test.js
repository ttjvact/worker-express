import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../dist/index.js';

// 検証対象: middleware が next() を呼ばない場合、後続のハンドラが実行されないことを確認する。
test('should NOT proceed to next middleware if next() is not called', async () => {
  const app = express();
  const order = [];

  app.use((req, res, next) => {
    // 目的: 最初のミドルウェアで処理を止め、next() を呼ばない。
    order.push('m1');
  });

  app.use((req, res, next) => {
    order.push('m2');
    return next();
  });

  app.get('/', (req, res) => {
    order.push('handler');
    res.send('ok');
  });

  await app.fetch(new Request('https://example.com/'));

  // next() が呼ばれていないため、m2 や handler は実行されないはず。
  assert.deepEqual(order, ['m1']);
});
