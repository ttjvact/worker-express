# worker-express ロードマップ（残タスク管理）

## 目的

- このドキュメントは、`worker-express` の**未完タスクと今後の対応順**を管理する。
- 完了済みの実装詳細はここで増やさず、これから対応する項目だけを残す。

---

## 運用ルール

- `0.1.0` を MVP リリースとする。
- このファイルには、**未着手または継続中のタスクのみ**を記載する。
- 対応完了した項目は削除するのではなく、`- [x]` に更新して履歴を残してよい。
- `x.y.z` の **z（パッチ）系バージョンは、明示指示があるまでバージョン更新しない**。
  - 例: `0.2.1` 相当の想定タスクを先行対応した場合でも、まずは本ファイル上のチェック更新のみ行う。
- リリース実施時のみ `CHANGELOG.md` を更新する。
- HTTP 応答仕様は Express 互換を優先し、`405 Method Not Allowed` はコアの標準応答に含めない。
- `0.2.0` まではバージョン単位で管理し、それ以降は「残タスク」として管理する。

---

## 現状メモ

- 基本ルーティング、`app.use()`、`req.params`、`req.query`、`next(err)` による 500 応答は実装済み。
- `middleware` 実行順序の基本ケースはテスト済み。
- 今後の焦点は、MVP 公開準備、Workers 実環境に寄せた結合テスト、破壊的変更の整理に置く。

---

## 0.0.1（コア実装）

- Cloudflare Workers 上で Express 風 API の最小セットを実装する。

1. 基盤セットアップ

- [x] package 初期化
- [x] TypeScript ビルド構成（`dist/index.js` と `dist/index.d.ts`）
- [x] lint / test の実行基盤

2. 最小 API 実装

- [x] `express()`
- [x] `app.get/post/put/patch/delete(path, ...handlers)`
- [x] `res.status()`, `res.set()`, `res.send()`, `res.json()`, `res.end()`
- [x] `app.fetch(request, env, ctx)`

3. ルーティング/ミドルウェア

- [x] `app.use()`
- [x] `next()`
- [x] path params（`/users/:id`）
- [x] `req.query`

4. エラーパス

- [x] `next(err)` による 500 応答

完了条件

- [x] README の最小サンプル相当が動作する。
- [x] テストが通る。

---

## 0.0.2（運用・ドキュメント整備）

- MVP 前提で利用者と開発者向けの基本ドキュメントを整える。

1. ドキュメント責務の明確化

- [x] `ROADMAP.md` を「残タスク管理」の前提に見直した
- [x] `AGENTS.md` に「ルール集約先」の位置づけを明記
- [x] `CHANGELOG.md` はリリース履歴に限定する方針を明記

2. 詳細ドキュメント追加

- [x] `docs/` 配下に詳細な使い方ガイドを追加
- [x] README から `docs/` への導線追加

3. 進行管理ルール

- [x] patch バージョン（z）運用ルールを本ファイルへ明記

完了条件

- [x] 新規参加者がリポジトリ上の README + docs を見て、ローカルで利用手順を再現できる。

---

## 0.0.3（Workers 結合テスト基盤）

- `0.1.0` の前提として、ローカル単体テストだけでは拾いにくい Workers 実行差分を確認できる状態にする。

1. 結合テスト導入

- [x] 手動確認は Wrangler、`node:test` の結合テストは Miniflare を使う方針を決める
- [x] `examples/` と専用 fixture を使って Workers 実行ベースの結合テストを追加する
- [x] CI またはローカル手順で結合テストを再現できるようにする

2. 確認対象の最小整理

- [x] 最小サンプルのルーティングが Workers 実行でも動くことを確認する
- [x] `app.use()` と route handler の基本連携を Workers 実行で確認する
- [x] `req.query` / `req.params` / `next(err)` の代表ケースを結合テストへ含める

完了条件

- [x] Workers 実行ベースの結合テストが追加され、MVP 前の確認項目として使える。

---

## 0.0.4（公開準備の土台）

- `0.1.0` の公開判定に必要な公開手順と配布前チェックを先に整える。

1. 公開前提の整備

- [ ] `oss_mvp_checklist.md` に従って、公開前に必要な Git / GitHub / npm の準備を進める
- [ ] npm 公開に必要な確認事項を `oss_mvp_checklist.md` で管理する
- [ ] checklist の結果を踏まえて、公開前に不足している作業を埋める

2. 公開品質の見える化

- [x] CI 設定（Node LTS matrix）を追加
- [ ] CI 緑化を公開判定条件として固定

完了条件

- [ ] `oss_mvp_checklist.md` を基準に `0.1.0` の公開判定に必要な手順と前提確認が揃っている。

---

## 0.1.0（MVP リリース）

- Cloudflare Workers 上で Express 風 API の最小セットを公開可能な状態にする。

1. 公開前の最終整備

- [ ] `oss_mvp_checklist.md` の未完項目を解消する
- [ ] README に公開時点のサポート範囲と Express 差分を最終反映する
- [ ] npm 配布物でも有効なドキュメント導線を確定する
- [ ] README の手順とサンプルコードの再現確認を行う

2. リリース実施

- [ ] `npm publish --access public` の実行条件を確認する
- [ ] `0.1.0` として publish する
- [ ] `CHANGELOG.md` と GitHub Release に公開内容を反映できる状態にする

完了条件

- [ ] README の最小サンプル相当が npm 配布物でも再現できる。
- [ ] publish 可能な品質ゲートを満たす。

---

## 0.2.0（破壊的変更の集約）

- 互換性影響のある仕様修正をまとめて実施する。

1. fallthrough 応答の Express ライク化

- [ ] ルート一致後に `next()` だけで応答未送信の場合、既定で 404 を返すよう修正する
- [ ] 未送信 fallthrough に関する既存テストを新仕様へ更新する
- [ ] README / docs に未送信時挙動を明記する

2. `headersSent` と状態遷移の整合化

- [ ] `send/json/end` 後に `status/set` で状態が変わらないよう修正する
- [ ] `headersSent` の意味を「以降の変更不可」と一致させる
- [ ] 状態遷移の境界値テストを追加する

3. `content-type` 上書き規則の固定

- [ ] `res.json()` 実行時の `content-type` 上書き規則を仕様として決める
- [ ] 実装を仕様どおりに固定する
- [ ] 事前に `content-type` を設定した場合のテストを追加する
- [ ] README / docs / API 記述を新仕様に合わせる

4. `res.end` の低レベル化

- [ ] `res.end` が本文変換や `content-type` 補完を暗黙に行わないよう見直す
- [ ] `res.send` と `res.end` の責務差分を明記する
- [ ] 低レベル API としての `res.end` テストを追加する

完了条件

- [ ] 破壊的変更の内容が実装・テスト・ドキュメントで一致している。
- [ ] `0.2.0` の変更点を利用者向けに説明できる状態になっている。

---

## 0.2 以降の残タスク

### 品質・検証

- [ ] エラー処理（`next(err)`）の境界値テストを追加する
- [ ] 型チェックを CI に組み込む
- [ ] 主要 API の破壊的変更を検知しやすい確認ルールを決める

### ドキュメント・開発者体験

- [ ] ユースケース別サンプル（API、middleware、error handler）を docs に追加する
- [ ] トラブルシュートを docs に追加する
- [ ] ローカル検証テンプレートとして `examples/` を拡充する
- [ ] 変更時チェックリストを docs 化する

### 配布・運用基盤

- [ ] GitHub Actions で release フローを整備する
- [ ] 変更履歴の更新手順を定義する
- [ ] 定期リリース時の運用手順を docs 化する

### 拡張 API

- [ ] `express.Router()` を追加する
- [ ] `app.route()` を追加する
- [ ] 既存 API との後方互換テストを追加する
- [ ] cookie helper を追加する
- [ ] CORS helper を追加する
- [ ] helper 利用時の推奨設定を docs 化する
- [ ] static 配信（Workers 制約前提）を検討・実装する
- [ ] Workers 制約と代替構成を docs に明記する

### 将来の安定化

- [ ] パフォーマンス測定（簡易ベンチ）を行う
- [ ] 主要 API の挙動凍結に向けて breaking change 候補を整理する
- [ ] リリース手順のリハーサルを行う
