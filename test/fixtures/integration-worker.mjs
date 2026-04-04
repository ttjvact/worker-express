import express from '../../dist/index.js';

const app = express();

app.use((req, res, next) => {
  // 目的: Workers 実行でも middleware の副作用が route handler まで維持されることを確認する。
  // 処理: 後続 handler が参照する値とレスポンスヘッダを事前に設定する。
  req.requestId = 'mf-request';
  res.set('x-middleware', 'ran');
  return next();
});

app.get('/', (req, res) => {
  res.send('Hello from Miniflare');
});

app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    q: req.query.q,
    requestId: req.requestId,
  });
});

app.get('/error', (req, res, next) => {
  return next(new Error('boom'));
});

export default app;
