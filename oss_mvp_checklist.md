# OSS MVP公開チェックリスト

最終更新: 2026-03-31

## 目的

`worker-express` を MVP として初回公開する前に、最低限の公開品質をまとめて確認する。

---

## 1. 公開方針

- [x] npm 公開する方針を決めた
- [x] package 名 `worker-express` を確定した
- [x] package 名が利用可能であることを確認した
- [x] ライセンスを決めた
- [x] サポート範囲を決めた
- [x] README に「できること」を明記した
- [x] README に「まだできないこと / 制約」を明記した
- [ ] README に、将来 breaking change がありうることを明記した

---

## 2. リポジトリとドキュメント

- [x] README に概要を書いた
- [x] README にインストール方法を書いた
- [x] README に最小サンプルを書いた
- [x] README に主要 API / 使い方を書いた
- [x] README に開発方法を書いた
- [x] README にライセンスを明記した
- [x] `docs/USAGE.md` を用意した
- [x] `CHANGELOG.md` を用意した
- [x] `CONTRIBUTING.md` を用意した

---

## 3. npm 配布物

- [x] npm アカウントを用意した
- [x] npm の 2FA を確認した
- [ ] 初回公開の手順を決めた
- [x] `package.json` に `name` / `version` / `description` がある
- [x] `package.json` に `license` / `repository` / `homepage` / `bugs` がある
- [x] `package.json` に `type` / `main` / `exports` / `types` がある
- [x] `package.json` の `files` で配布対象を絞っている
- [x] `npm pack` で配布物を確認した
- [x] 配布物に `README` / `LICENSE` / `dist` が含まれる
- [x] 不要ファイルが配布物に入っていない
- [x] `private: true` になっていない
- [ ] `npm publish --access public` の実行条件を確認した

---

## 4. GitHub 運用

- [x] デフォルトブランチを `main` に統一した
- [x] `main` を公開用安定ブランチとして扱う方針を決めた
- [x] 通常作業はブランチを切り、`main` へは PR 経由で取り込む方針を決めた
- [x] `main` の branch protection か ruleset を設定した
- [x] force push を禁止した
- [x] branch deletion を禁止した
- [x] 必要なら status checks 必須を設定した
- [x] squash merge などのマージ方法を決めた(aquashのみ)
- [x] GitHub Releases を使うか決めた(使用)
- [x] Issues / PR / Discussions の運用を決めた
  - Issues: バグ報告・機能提案・作業タスクを扱い、1 issue 1 topic を原則にする
  - PR: 1 PR 1 目的で作成し、概要・変更点・確認項目を記載してレビュー可能な単位に保つ
  - Discussions: 質問、使い方相談、アイデア整理、仕様検討の入口として使い、未確定事項を issue 化する前段に置く

---

## 5. 品質とセキュリティ

- [x] CI で `install` / `lint` / `test` / `build` が回る
- [x] CI が `push` / `pull_request` / Node `20`, `22` を対象にしている
- [x] `npm audit` などで依存パッケージの脆弱性を確認した
- [x] `.env` や API キー、トークンが履歴に含まれていないことを確認した
- [ ] GitHub の Security 機能を必要に応じて有効化した

---

## 6. 公開直前

- [x] クローン直後にセットアップできることを確認した
- [ ] README の手順を手元で再現した
- [ ] サンプルコードが動くことを確認した
- [x] 公開するバージョン番号とタグ名を確定した
- [x] 公開範囲に秘密情報がないことを最終確認した
- [ ] 公開後に困らない最低限の説明が揃っている

---

## 7. 公開後

- [ ] GitHub Release を作成した
- [ ] npm 公開後に別環境で install 動作を確認した
- [ ] README の install コマンドを実際に確認した
- [ ] 今後のロードマップを案内できる状態にした
