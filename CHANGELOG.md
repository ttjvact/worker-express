# Changelog

このファイルは、リリース済みバージョンの変更履歴を記録します。

## 0.3.0 - 2026-05-26
- `multipart/form-data` のテキスト項目を `req.body`、ファイル項目を `req.files` に分離する Workers 向けフォーム処理を追加。
- `WorkerExpressFile` 型を追加し、`req.files[0].text()` / `arrayBuffer()` / `stream()` でファイル本文を扱えるようにした。
- `application/x-www-form-urlencoded` の本文を `FormData` ではなく plain object として `req.body` に格納するように変更。同名キーは配列化。
- `Content-Type` 判定を media type の正規化に寄せ、charset 付きフォーム本文と `application/*+json` 系 JSON 本文を安定して扱えるようにした。
- README / docs にフォーム本文と `req.files` の利用方法を追記。

## 0.2.0 - 2026-04-21
- ルート一致後に応答未送信のまま `next()` で終了した場合、既定で `404 Not Found` を返すように変更。
- `send/json/end` 後は `headersSent` を `true` とし、以降の `status/set` が確定済みレスポンスを変更しないように修正。
- `res.json()` は `content-type` 未設定時のみ `application/json; charset=utf-8` を補完し、事前設定済みの値を維持する仕様に固定。
- `res.end()` を低レベル API として整理し、本文変換や `content-type` 補完を暗黙に行わないように変更。
- middleware 停止時のテストを標準の unit test 対象へ組み込み。

## 0.1.0 - 2026-04-05
- MVP 初版を公開。
- Cloudflare Workers 向けに、Express 風の基本 API（routing / middleware / `req` / `res`）を提供。
- `app.use()`、path params、`req.query`、`next(err)` による最小の 500 応答を含む。
- `express.Router()`、`app.route()`、cookie / CORS helper、static 配信は未対応。
