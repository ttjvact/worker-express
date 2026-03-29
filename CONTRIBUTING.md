# Contributing

`worker-express` への変更は、公開品質を保ちながら小さく安全に積み上げることを前提にします。

## ブランチ運用

- `main` は公開用の安定ブランチです。
- 日常の作業は `main` に直接積まず、作業用ブランチで進めます。
- リリース対象にしたい変更だけを `main` に取り込みます。

## 作業用ブランチ

- 新しい作業は `main` からブランチを切って開始します。
- ブランチ名は内容が分かるものを使います。
- 例: `feat/add-json-response-test`, `fix/headers-sent-state`, `docs/readme-support-matrix`

## マージ方針

- 原則として `main` への取り込みは Pull Request 経由で行います。
- 1つの Pull Request では、1つの目的に絞って変更します。
- レビューしやすさを優先し、大きな変更は複数の Pull Request に分割します。
- CI が失敗している Pull Request はマージしません。

## コミット方針

- コミットは意味のある単位で分けます。
- メッセージは変更内容が分かる短い要約にします。
- 必須ではありませんが、必要に応じて `feat:`, `fix:`, `docs:`, `test:` を利用できます。

## ローカル確認

変更前後で、少なくとも次を確認してください。

```bash
npm run lint
npm test
```

## ドキュメント更新

- API や既定挙動を変える場合は、`README.md`、`docs/USAGE.md`、`ROADMAP.md` の差分も確認してください。
- Express 互換性に影響する変更は、差分を明記してください。
