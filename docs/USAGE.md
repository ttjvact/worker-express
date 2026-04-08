# 詳細利用ガイド（worker-express）

このドキュメントは、README の最小サンプルを補完するための詳細手順です。

## 1. 基本の使い方

```js
import express from 'worker-express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
```

- `export default app` とすることで、Cloudflare Workers の `fetch` ハンドラとして動作します。

## 1.1 サポート範囲

- 実行環境は Cloudflare Workers を対象とします。
- 開発 / 検証環境は Node.js LTS の最新 2 系統を対象とします。
- 現時点の対象バージョンは `20` と `22` です。

---

## 2. ルーティング

### 2.1 HTTP メソッド

`app.get/post/put/patch/delete(path, ...handlers)` を利用できます。

```js
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/users', async (req, res) => {
  res.status(201).json({ created: true, body: req.body });
});
```

### 2.2 パスパラメータ

```js
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});
```

### 2.3 fallthrough の既定挙動

ルートが一致していても、ハンドラ連鎖の最後まで `res.send()/res.json()/res.end()` などで応答確定しない場合は `404 Not Found` を返します。

```js
app.get('/users/:id', (req, res, next) => {
  if (req.params.id === '42') return res.send('ok');
  return next(); // 応答未送信のまま chain が終わると 404
});
```

---

## 3. ミドルウェア

`app.use()` で共通処理を差し込めます。

```js
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID?.() ?? 'local-id';
  next();
});

app.get('/debug', (req, res) => {
  res.json({ requestId: req.requestId });
});
```

- ミドルウェアは登録順で実行されます。
- 次の処理へ進めるには `next()` を呼びます。

---

## 4. Request の主な参照項目

- `req.method`
- `req.url`
- `req.path`
- `req.query`
- `req.params`
- `req.headers`
- `req.body`（JSON / text）

### 4.1 クエリ文字列

`/search?q=worker-express&page=1` の場合:

```js
app.get('/search', (req, res) => {
  res.json({ q: req.query.q, page: req.query.page });
});
```

### 4.2 JSON ボディ

```js
app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});
```

---

## 5. Response の主な操作

- `res.status(code)`
- `res.set(name, value)`
- `res.send(body)`
- `res.json(data)`
- `res.end(body?)`

```js
app.get('/custom', (req, res) => {
  res
    .status(200)
    .set('x-powered-by', 'worker-express')
    .json({ message: 'ok' });
});
```

### 5.1 `headersSent` と状態凍結

`send/json/end` を呼んだ後は `headersSent === true` になり、以降の `status/set` は反映されません。

```js
app.get('/frozen', (req, res) => {
  res.send('locked');
  res.status(201).set('x-late', 'ignored'); // 変更されない
});
```

### 5.2 `content-type` の規則

- `res.send()` は `content-type` 未指定時のみ `text/plain; charset=utf-8` を補完します。
- `res.json()` は `content-type` 未指定時のみ `application/json; charset=utf-8` を補完します。
- `res.json()` 実行前に `content-type` を明示設定している場合は、その値を維持します。

### 5.3 `res.send` と `res.end` の責務差分

- `res.send()` は高レベル API です。文字列化と `content-type` 補完を行います。
- `res.end()` は低レベル API です。渡した本文をそのまま使い、`content-type` は自動補完しません。

```js
app.get('/raw-end', (req, res) => {
  res.end('raw-body');
});
```

---

## 6. エラーハンドリング

`next(err)` を呼ぶと 500 応答にフォールバックします。

```js
app.get('/error', (req, res, next) => {
  next(new Error('unexpected failure'));
});
```

- 例外ケースがある処理は、`next(err)` へ明示的に渡してください。

---

## 7. Cloudflare Workers での配置メモ

`wrangler.toml` 例:

```toml
name = "worker-express-example"
main = "src/index.ts"
compatibility_date = "2025-01-01"
```

- エントリーポイントで `export default app` を返す構成にしてください。

### 7.1 ローカル結合テスト

- `node:test` で Workers 実行相当の確認をしたい場合は `Miniflare` を使います。
- このリポジトリでは `npm run test:integration` が `test/miniflare.test.js` を実行します。

### 7.2 手動確認

- 手動の動作確認は `Wrangler` を使います。
- `npm run dev:hello` を実行すると、`examples/hello-world/wrangler.jsonc` を使ってサンプル Worker を起動できます。

---

## 8. バージョン運用ルール（利用者向け）

- 今後の予定タスクは `ROADMAP.md` を参照してください。
- 実際に公開済みの変更履歴は `CHANGELOG.md` を参照してください。
- patch（z）バージョンの予定タスクは、指示があるまで「チェック更新のみ」で管理される運用です。
