# Changelog

このファイルは、リリース済みバージョンの変更履歴を記録します。

## 0.1.0 - 2026-04-05
- MVP 初版を公開。
- Cloudflare Workers 向けに、Express 風の基本 API（routing / middleware / `req` / `res`）を提供。
- `app.use()`、path params、`req.query`、`next(err)` による最小の 500 応答を含む。
- `express.Router()`、`app.route()`、cookie / CORS helper、static 配信は未対応。
