# worker-express

Cloudflare Workers 向けの最小 Express 風ルーティングライブラリです。内部実装は TypeScript で管理し、配布物は ESM (`dist/index.js`) と型定義 (`dist/index.d.ts`) を同梱します。

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

TypeScript 利用時も同じ import で型補完が有効になります。

## サポート範囲

- 実行環境: Cloudflare Workers
- 開発 / 検証環境: Node.js LTS の最新 2 系統（現時点では `20`, `22`）
- 配布形式: ESM (`dist/index.js`) + 型定義 (`dist/index.d.ts`)

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
main = "src/index.ts"
compatibility_date = "2025-01-01"
```

`src/index.ts` で `export default app` すれば `fetch` ハンドラとして動作します。


## 詳細ドキュメント

詳細な使い方は `docs/USAGE.md` を参照してください。
