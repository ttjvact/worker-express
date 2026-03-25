# worker-express ロードマップ

## 0. 目標（MVPの定義）
- Cloudflare Workers 上で、Express 風の記法でルーティングできる最小実装を提供する。
- 最終的な利用体験は次のイメージを満たす。

```js
import express from "worker-express";

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
```

- `export default app` の時点で Worker の `fetch` ハンドラとして動作する（利用者が `fetch` を意識しなくて良い）。

---

## 1. 全体アーキテクチャ方針

### 1.1 API設計（Express 互換の優先度）
MVP では以下を優先実装し、段階的に互換性を上げる。

- `express()`
- `app.use(middleware)`
- `app.get/post/put/patch/delete(path, ...handlers)`
- `req`
  - `req.method`, `req.url`, `req.path`, `req.query`, `req.params`
  - `req.headers`, `req.body`（JSON / text）
- `res`
  - `res.status(code)`
  - `res.set(name, value)`
  - `res.json(data)`
  - `res.send(body)`
  - `res.end()`
- エラーハンドリング
  - `next(err)`
  - 最後に統一エラーレスポンス

### 1.2 Worker 変換レイヤ
- 内部では `Request -> Context(req/res/next) -> Response` のパイプラインを実装。
- `app.fetch(request, env, ctx)` を実装し、`export default app` 時に `{ fetch: app.fetch }` として使えるようにする。
- ルーティングは軽量化を優先し、最初は静的パス + `:param` を実装。必要なら将来 trie ベースへ拡張。

### 1.3 実行環境
- ランタイム: Cloudflare Workers。
- 開発/検証: `wrangler dev`。
- Node 依存 API は避け、Workers 互換 API のみ利用。

---

## 2. 実装フェーズ（優先順）

### フェーズ1: 土台（1〜2週）
1. パッケージ初期化
   - `package.json`（ESM, exports, types）
   - `tsup` or `rollup` でライブラリビルド
2. コアクラス
   - `createApp()` / `Router`
   - middleware chain 実装
3. 最小レスポンス
   - `res.status`, `res.send`, `res.json`
4. `app.fetch` 実装
   - Worker `fetch(request, env, ctx)` 直結

**完了条件**
- `app.get('/', ...)` が `wrangler dev` で動作。
- `export default app` で Worker として動作。

### フェーズ2: ルーティング・Request拡張（1〜2週）
1. path params
   - `/users/:id`
2. query parsing
3. body parsing（JSON/text）
4. 複数 middleware + `next()`

**完了条件**
- Express 的な基本 CRUD API が実装可能。

### フェーズ3: 互換性・安定化（1〜2週）
1. エラーハンドリング middleware
2. 404 / 405 の標準応答
3. `res.set`, `res.end`、header 上書き規則の整理
4. パフォーマンス測定（簡易ベンチ）

**完了条件**
- 主要 API がドキュメント通り動作し、CI でテスト緑。

### フェーズ4: 拡張機能（任意）
- サブルータ `express.Router()`
- `app.route()`
- cookie helper
- CORS helper
- static 配信（Worker 制約前提）

---

## 3. npm 公開計画

### 3.1 パッケージ構成
- パッケージ名候補: `worker-express`
- 出力形式
  - ESM: `dist/index.js`
  - 型定義: `dist/index.d.ts`
- `package.json` 例方針
  - `"type": "module"`
  - `"exports"` を設定
  - `"files": ["dist"]`
  - `"engines"` で Node LTS を明記（開発用途）

### 3.2 リリース運用
- バージョニング: SemVer
- pre-release: `0.x`
- 安定化後: `1.0.0`
- 変更履歴: `CHANGELOG.md`（Conventional Commits + 自動生成推奨）

### 3.3 品質ゲート（publish前）
- `npm pack` で同梱物確認
- examples が最新 API と一致
- README の最短サンプルが実行可能

---

## 4. テスト戦略

### 4.1 テスト層
1. 単体テスト
   - ルータのマッチング
   - middleware chain
   - `res` 系メソッド
2. 結合テスト（Worker 実行）
   - Miniflare or Wrangler test 環境で `fetch` 呼び出し
3. E2E テスト
   - example アプリを起動して HTTP 検証

### 4.2 テストケース（MVP必須）
- `GET /` で 200 + body
- 不一致ルートで 404
- `req.params` が正しく取得できる
- `req.query` が decode される
- JSON body を `req.body` に反映
- middleware 実行順序の保証
- `next(err)` で 500 ハンドリング

### 4.3 CI（GitHub Actions想定）
- Node LTS matrix（例: 20, 22）
- `npm run lint`
- `npm run test`
- `npm run build`
- 必要であれば型チェック

---

## 5. 推奨ディレクトリ構成

```text
worker-express/
  src/
    app.js
    router.js
    request.js
    response.js
    middleware.js
    errors.js
    index.js
  test/
    unit/
    integration/
    e2e/
  examples/
    hello-world/
  .github/workflows/ci.yml
  package.json
  README.md
  CHANGELOG.md
```

---

## 6. 初期マイルストーン（実行順）

### M1: プロジェクト起動
- [ ] package 初期化
- [ ] ビルド設定
- [ ] lint/format 設定
- [ ] テストランナー設定

### M2: 最小 API 実装
- [ ] `express()`
- [ ] `app.get()`
- [ ] `res.send()`
- [ ] `app.fetch()`
- [ ] hello-world example

### M3: Middleware / params
- [ ] `app.use()`
- [ ] `next()`
- [ ] `:param`
- [ ] `req.query`

### M4: 公開準備
- [ ] README 整備
- [ ] API 仕様表
- [ ] CI 緑化
- [ ] `npm publish --access public` 実施

---

## 7. リスクと対策
- **Express 完全互換の期待値過多**
  - 対策: README に「互換レベル表」を明記。
- **Workers と Node 差分で middleware が壊れる**
  - 対策: Node 専用依存を持つ middleware 非対応を明記。
- **レスポンス確定後の二重書き込み**
  - 対策: `res.headersSent` 相当フラグで保護。

---

## 8. README の最初に載せるべき内容
1. 3行でわかるコンセプト
2. インストール方法
   - `npm i worker-express`
3. 最小サンプル
4. 対応 API 一覧（対応 / 未対応）
5. Cloudflare Workers での実行方法（`wrangler.toml` 例）

---

## 9. まず最初に実行する具体タスク（今日やること）
1. リポジトリ初期ファイル作成（`package.json`, `src/index.js`, `README.md`）
2. `app.get` + `res.send` + `app.fetch` まで最短実装
3. `examples/hello-world` を `wrangler dev` で疎通
4. 単体テストを 5 ケース実装
5. CI を追加して pull request で自動実行

この順で進めると、最短で「動くMVP」を公開し、そこから互換性を安全に積み上げられる。
