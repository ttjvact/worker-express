# Changelog

このファイルは、リリース済みバージョンの変更履歴を記録します。

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
