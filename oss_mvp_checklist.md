# OSS MVP公開チェックリスト

最終更新: 2026-03-29

## 目的

MVPとして OSS を初回公開する際に、最低限やっておくべき項目を漏れなく確認する。  
特に **Git / GitHub の事故防止設定** を優先する。

---

## 1. 公開前に決めること

### 1-1. MVPとして何を保証するか

- [ ] 「できること」を 3〜5個に絞って明文化した
- [ ] 「まだできないこと」「未対応」を明文化した
- [ ] 既知の制約・非互換・簡略仕様を README に書いた
- [ ] 破壊的変更が今後起こりうるなら、その可能性を README に書いた

### 1-2. 公開範囲

- [ ] Public repository にするか確認した
- [x] npm公開するか、GitHub公開だけにするか決めた
- [x] ライセンスを決めた
- [x] サポート範囲（Nodeバージョン、実行環境、OS）を決めた

---

## 2. Git / GitHub 設定まわり（最優先）

### 2-1. デフォルトブランチ

- [x] デフォルトブランチを `main` に統一した
- [x] 普段作業するブランチと公開用ブランチの役割を決めた
- [x] 直接 `main` に push する運用にするか、PR経由にするか決めた

> 個人開発の初期OSSなら、最低でも  
> **`main` をデフォルトブランチにして、公開用の安定ブランチとして扱う**  
> という形にしておくと事故が減る。

### 2-2. ブランチ保護

- [ ] `main` の branch protection か ruleset を設定した
- [ ] force push を禁止した
- [ ] branch deletion を禁止した
- [ ] 必要なら PR merge 前に status checks 必須にした
- [ ] 必要なら linear history を有効にした
- [ ] 必要なら「レビュー必須」にした

GitHub では、保護ブランチで **force push の禁止・削除禁止・status checks 必須・レビュー必須** などを設定できます。rulesets は branch protection rules と並行利用でき、対象ブランチや適用ルールを管理できます。 :contentReference[oaicite:0]{index=0}

### 個人開発OSS向けのおすすめ

最初は次のどちらかで十分です。

#### 最低限プラン

- [ ] `main` への force push 禁止
- [ ] `main` の削除禁止

#### 少し堅めプラン

- [ ] `main` への force push 禁止
- [ ] `main` の削除禁止
- [ ] PR必須
- [ ] CI成功を必須
- [ ] squash merge を基本にする

### 2-3. マージ方法

- [ ] Merge commit / Squash / Rebase のどれを許可するか決めた
- [ ] 履歴を綺麗にしたいなら squash merge を有効にした
- [ ] rebase merge を使うなら運用ルールを決めた

> OSS初期は **Squash merge 中心** が扱いやすい。  
> PR単位で履歴がまとまり、あとから追いやすい。

### 2-4. タグ / リリース運用

- [ ] `v0.1.0` のようなタグ形式を決めた
- [ ] 初回公開タグを打つタイミングを決めた
- [ ] GitHub Releases を使うか決めた
- [ ] リリースノートの書き方を決めた

GitHub の rulesets はブランチだけでなくタグにもルールを設定できます。タグやリリースを運用するなら、誰が作成・更新できるかを整理しておくと事故防止になります。 :contentReference[oaicite:1]{index=1}

### 2-5. Issue / PR 設定

- [ ] Issues を有効にした
- [ ] PR を有効にした
- [ ] 必要なら issue template を追加した
- [ ] 必要なら pull request template を追加した
- [ ] Discussions を使うか決めた

### 2-6. 権限とアカウント運用

- [ ] 個人アカウント配下で公開するか、Organization 配下にするか決めた
- [ ] 外部 collaborator を入れる予定があるなら権限を見直した
- [ ] PAT やトークンを repo に置いていないことを確認した

> 1人開発の初期OSSなら、まずは個人アカウントでも問題ない。  
> チーム開発や権限分離が必要になったら Organization へ移す形で十分。

---

## 3. Git ローカル設定

### 3-1. `.gitignore`

- [x] `node_modules`
- [x] `.env`
- [x] `.env.*`
- [x] `dist`
- [x] `coverage`
- [x] OS依存ファイル
- [x] IDE設定ファイル
- [x] 秘密鍵や証明書類

### 例

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
*.pem
*.key
```

### 3-2. 改行・文字コード

- [ ] `.gitattributes` を置いた
- [ ] 改行コードの混在を防ぐ設定にした
- [ ] バイナリ扱いしたい拡張子を必要に応じて定義した

### 例

```gitattributes
* text=auto
*.png binary
*.jpg binary
*.zip binary
```

### 3-3. コミット運用

- [ ] コミットメッセージの粒度を決めた
- [ ] `fix:`, `feat:`, `docs:` などの規約を使うか決めた
- [ ] 初回公開前に不要な試行錯誤コミットを整理するか決めた

初回は綺麗すぎなくてもいいですが、
秘密情報が混ざっていないかだけは必ず確認する。

---

## 4. GitHub リポジトリの基本整備

### 4-1. README

- [x] プロジェクト概要がある
- [x] 何ができるかを書いた
- [ ] 何がまだできないかを書いた
- [x] インストール方法を書いた
- [x] 最小サンプルを書いた
- [x] API もしくは主要な使い方を書いた
- [ ] 開発方法を書いた
- [ ] ライセンスを明記した

### 4-2. LICENSE

- [x] `MIT`, `Apache-2.0`, `GPL` などのライセンスを追加した
- [ ] README にライセンスを明記した

### 4-3. CHANGELOG

- [x] 初回は簡易でも作成した
- [x] `0.1.0` で何を含むか書いた

### 4-4. CONTRIBUTING / CODE_OF_CONDUCT

- [x] すぐ不要でも、将来コントリビュートを受けるなら用意を検討した
- [x] Issue / PR の出し方を簡単に書いた

---

## 5. npm 公開する場合

### 5-0. アカウント準備

- [ ] npm アカウントを用意した
- [ ] npm の 2FA 設定を確認した
- [x] 公開予定の package 名が利用可能か確認した
- [ ] 初回公開の手順を決めた

### 5-1. `package.json`

- [x] `name` が確定している
- [x] `version` が適切
- [x] `description` がある
- [ ] `license` がある
- [ ] `repository` がある
- [ ] `homepage` がある
- [ ] `bugs` がある
- [x] `type` を確認した
- [x] `main` / `module` / `exports` を確認した
- [x] `types` を確認した
- [x] `files` で配布対象を絞った

### 5-2. 公開前チェック

- [x] `npm pack` で配布物を確認した
- [x] 不要ファイルが入っていない
- [x] 必要ファイルが漏れていない
- [x] `README`, `LICENSE`, `dist` が含まれる
- [x] `private: true` になっていない
- [ ] `npm publish --access public` が必要か確認した

npm の公開では package.json のメタデータや配布対象の整理が重要で、公開前に npm pack で中身確認する運用が有効です。npm の公式ドキュメントでも package の公開方法や package 内容の確認方法が案内されています。

---

## 6. CI（最低限）

- [x] `install`
- [x] `lint`
- [x] `test`
- [x] `build`

の4つが GitHub Actions などで最低限回るようにした。

### 例

- [x] `push` 時に実行
- [x] `pull_request` 時に実行
- [x] Node の対応バージョンで matrix 実行

GitHub の保護ブランチでは、必要な status checks を merge 条件にできます。CI を回しているなら、それを main へのマージ条件にするのが基本です。

---

## 7. セキュリティ・事故防止

- [ ] `.env` をコミットしていない
- [ ] API キーやトークンを履歴に含めていない
- [ ] サンプル設定は `.env.example` にした
- [ ] 依存パッケージの脆弱性をざっと確認した
- [ ] GitHub の Security タブ機能を必要に応じて有効化した
- [ ] 公開前に `npm audit` か同等確認を実施した

GitHub はブランチ保護や rulesets に加えて、コードレビューや各種セキュリティ機能を組み合わせる前提で案内しています。特に公開リポジトリでは、レビュー前提や保護設定の整備が事故防止に有効です。

---

## 8. リリース直前チェック

- [ ] クローン直後にセットアップできる
- [ ] README の手順が手元で再現できる
- [ ] サンプルコードが動く
- [ ] バージョン番号が意図通り
- [ ] タグ名が意図通り
- [ ] 公開範囲に秘密情報がない
- [ ] 初回 issue が来ても困らない最低限の説明がある

---

## 9. 初回公開後すぐやること

- [ ] GitHub Release を作成
- [ ] npm 公開したなら install 動作を別環境で確認
- [ ] README の install コマンドを実際に試す
- [ ] issue が来たときの分類ラベルを作る
- [ ] 今後のロードマップを簡単に書く
- [ ] `v0` 系なので破壊的変更がありうるなら明記する

---

## 10. 初期OSS向けの現実的な結論

初回の OSS MVP 公開で最低限必要なのは、全部を完璧にすることではなく、次の4点です。

- README が最低限読める
- ライセンスがある
- `main` が事故らない GitHub 設定になっている
- `install` / `build` / `test` の最低限が通る

特に GitHub 設定は、まずこれだけで十分。

### 最低限の推奨設定

- [ ] `main` をデフォルトブランチにする
- [ ] `main` の force push を禁止
- [ ] `main` の削除を禁止
- [ ] CI を 1 本作る
- [ ] CI 成功を merge 条件にする
- [ ] squash merge を有効にする

---

## 11. 自分用メモ（公開前に最終確認）

- [x] README 書いた
- [x] LICENSE 置いた
- [x] `.gitignore` 見直した
- [ ] `.env` 混入なし
- [x] `package.json` 見直した
- [x] `npm pack` 確認した
- [ ] CI 通った
- [ ] `main` 保護した
- [ ] `v0.1.0` タグ準備 OK
- [ ] 公開してよい状態
