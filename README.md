# worker-express

Cloudflare Workers 向けの最小 Express 風ルーティングライブラリです。

## インストール

```bash
npm i worker-express
```

## 最小サンプル

```js
import express from 'worker-express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
```

## 対応API（MVP）

- `express()`
- `app.use(middleware)`
- `app.get/post/put/patch/delete(path, ...handlers)`
- `req.method`, `req.url`, `req.path`, `req.query`, `req.params`, `req.headers`, `req.body`
- `res.status(code)`, `res.set(name, value)`, `res.send(body)`, `res.json(data)`, `res.end()`
- `next(err)` による 500 応答

## Cloudflare Workers での実行

`wrangler.toml` 例:

```toml
name = "worker-express-example"
main = "src/index.js"
compatibility_date = "2025-01-01"
```

`src/index.js` で `export default app` すれば `fetch` ハンドラとして動作します。
