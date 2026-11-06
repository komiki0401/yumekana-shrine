# クラウド開発の再開手順

2026-11-04作成。対象：`komiki0401/yumekana-shrine`、開発の基準ブランチは `main`。

## 初回の準備

クラウド開発環境でこのGitHubリポジトリを選択するか、以下で取得する。
Node.js 24・npm 11を使用する（GitHub Actionsと同じ構成）。環境変数・APIキー・DBは不要。

```sh
git clone https://github.com/komiki0401/yumekana-shrine.git
cd yumekana-shrine
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

クラウド環境のポート転送・プレビュー機能で5173番を開き、転送URLの `/yumekana-shrine/` へアクセスする。
クラウドマシンの `127.0.0.1` URLを手元のスマホ・PCで直接開いても接続できない。

## 既存のクラウド作業領域を再利用する場合

まず `git status` を確認。未コミット変更がある場合はバックアップしてから比較し、上書きしない。
作業ツリーがクリーンなら `git switch main`、`git pull --ff-only origin main`、`npm ci` の順に実行する。
分岐してpullできない場合は、その場でresetせず双方をバックアップして比較する。

## 現在の実装

- 開運暦：2025〜2027年の旧暦・六曜・暦注・月相・月のサイン・惑星逆行。おみくじも維持。計算方法と制限は [試験版の説明](lucky-calendar-trial.md) を参照。
- お礼参り：選択肢が光り、選択済み欄へ下がるアニメーション。動きを減らす設定にも対応。
- 機能コミット：`59005da`。この引き継ぎ文書のコミットも取得するため、再開時は最新mainを使う。

- 夢をはぐくむ：明示したモックの予祝体験、編集可能な桜の絵馬、下書き保存。実AIは未設定で課金なし。
- 奇跡図鑑：全50種類を実装。追加40枚はオリジナルSVG、全種類が抽選・図鑑・保存・開発プレビューに対応。詳細は [演出の説明](miracle-effects.md) を参照。

- BGM：オリジナル96秒ループ「こもれびの願い」。初期OFF、効果音と独立した音量・設定保存・非表示時停止。音源とクレジットは public/audio/、制作と再生の説明は [BGMの説明](bgm.md)。通常起動・ビルドで音源制作は不要です。

- 境内の成長：感謝度＋期待度の合計0・15・50で3段階の外観。既存データから導出し、新たなポイント管理は不要。[成長の説明](shrine-growth.md) を参照。

## 検証と公開

```sh
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

現在の検証は単体・Node合計86件、通常ブラウザ168件成功。予祝APIスタブの4件も別コマンド・GitHub Actionsで実行します。Playwrightは個人のブラウザと別のテスト環境で動作する。
環境に既存Chromiumがある場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で実際の実行ファイルを指定できる。
ブラウザ依存のインストールに管理権限が必要な場合は、クラウド環境のセットアップ機能を利用する。

ユーザーは変更のコミット・push・公開を許可済み。通常は作業ブランチで変更・検証し、mainへ反映してpushする。
mainへのpushで `.github/workflows/deploy.yml` がテスト・ビルド後にGitHub Pagesへ公開する。
pushにはクラウド側のGitHub認証も必要。トークンは環境の認証機能で扱い、リポジトリに保存しない。
公開URL：<https://komiki0401.github.io/yumekana-shrine/>

## 保存データ・秘密情報

夢・感謝・小判などは、各ブラウザのlocalStorage `yumekana-shrine:v1` に保存される。
ソースをclone/pullしてもスマホやローカルの保存データは移らない。クラウドのプレビューは別の保存先になる。
データ移行・統合を自動実行しない。必要な場合は [バックアップと統合手順](data-merge.md) に従い、元データを保護する。
本作業ではユーザーのlocalStorageを読み書きしていない。

`.local-backups/`、`.env*`、秘密鍵、認証情報、個人の保存データJSONはGitHubへ追加しない。
`.gitignore` の除外を維持し、`git add -f` は使わない。コミット前にステージされたファイルと差分を確認する。
ローカルのGit bundle・作業ツリーコピーは `.local-backups/` にだけ保管しており、クラウドへは転送しない。
