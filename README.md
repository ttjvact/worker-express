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

## できること

- Cloudflare Workers で Express 風の最小ルーティングを組めます。
- `app.use()` によるミドルウェア実行ができます。
- path params と `req.query` を扱えます。
- `res.status()`, `res.set()`, `res.send()`, `res.json()`, `res.end()` を使えます。
- `next(err)` による最小の 500 応答へフォールバックできます。

## まだできないこと / 制約

- `express.Router()` や `app.route()` には未対応です。
- cookie / CORS helper や static 配信は未対応です。
- 既定挙動は Express 互換を志向しますが、完全互換ではありません。
- Node.js の HTTP サーバー実装としての Express 互換実行は対象外です。

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

## 開発方法

```bash
npm install
npm run lint
npm test
```

Workers 実行に近い確認は `Miniflare` を使った `npm run test:integration` で行えます。手動確認は `Wrangler` を使い、`npm run dev:hello` で `examples/hello-world` を起動します。

## 詳細ドキュメント

詳細な使い方は `docs/USAGE.md` を参照してください。

## ライセンス

MIT License
