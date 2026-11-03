# 公開サイトとローカルサイトの保存データを安全に統合する

## GitHubに保存するもの・ローカルに残すもの

| 保存先 | 対象 | 理由 |
| --- | --- | --- |
| GitHubにコミットする | `.gitignore` | バックアップや個人データの誤追加を防ぐ |
| GitHubにコミットする | `docs/data-merge.md` | 再利用できるバックアップ・比較・復元の手順 |
| GitHubにコミットする | `scripts/merge-storage.mjs`、`scripts/storage-merge.mjs`、`scripts/storage-merge.test.mjs` | オフライン比較ツールと二重計上防止テスト。個人の実データは含まない |
| ローカルだけで保管する | `.local-backups/` 全体 | Git bundle、作業ファイルコピー、差分、保存データの原本・統合候補・比較レポート・試験生成物 |
| ローカルだけで保管する | ブラウザからダウンロードしたJSON、手動の競合判断メモ | 個人の夢・感謝・履歴を含みうる。`.local-backups/` に移して保管 |
| Git管理しない生成物 | `node_modules/`、`dist/`、`*.tsbuildinfo`、`test-results/`、`playwright-report/` | 再生成可能。既存のignore設定を維持 |

バックアップを `git add -f` で強制追加しない。将来コミットするときも対象を明示し、ステージした差分に実データがないことを確認する。
この整理だけではコミット・push・デプロイは実行しない。

## ローカル起動

プロジェクト直下で以下を実行し、`http://127.0.0.1:5173/yumekana-shrine/` を開く。

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

保存先を取り違えないよう、同じホスト名とポートを使う。開発サーバー起動だけでは保存データの統合は行われない。

## 今回のソース比較（2026-11-03）

ローカルmainとfetch後のorigin/mainはともに `8c9c5b7fedfe86f75c174c7abb51b1dcee8dfffe`。
未コミット・ステージ済み・未追跡の作業ファイルはなかった。`git merge --ff-only origin/main` は更新不要。

統合前のバックアップは `.local-backups/20261103-161058/` に保存した。

- `local-all-refs.bundle`: ローカルの全Git参照と履歴（verify成功）
- `github-main.bundle`: fetchしたGitHub最新mainと履歴（verify成功）
- `working-tree/`: 作業ツリーの追跡ファイルと未追跡・非ignoreファイルのコピー
- `local-working.patch` / `local-staged.patch`: 未コミット差分とステージ済み差分
- `local-status.txt` / `local-head.txt`: 比較前の状態

ignore対象のnode_modulesやdist、既存の秘密ファイルはこの作業コピーには含めない。
このディレクトリを別の安全な保存先にもコピーする。バックアップと個人データはGitに追加しない。
復旧は元のディレクトリを変更せず `git clone <bundleの絶対パス> <新しいディレクトリ>` で行い、必要な作業ファイルをコピーする。

## 保存先と構造

保存キーは `yumekana-shrine:v1`、`version: 1`。DBやサーバーへの保存はない。

| 項目 | 保存形式と統合時の注意 |
| --- | --- |
| dreams | UUID付きの夢。編集・達成に更新時刻がない。同じIDの異なる値は手動確認 |
| transactions | UUID、日付、amount、kind、任意のdreamId/goalId。残高はamountの合計。奉納はkind=offerの件数 |
| gratitudes | UUID、日付、本文、createdAt、任意のpointsAwarded/selectedThanks/freeText/dreamId。記録とポイントは別 |
| spirit | gratitude/expectationの累計。単純合算しない。削除済みの記録や旧仕様の加点も含みうる |
| spiritCredits | dreamsのtitle/suggestionキー、gratitudesの旧「日付\|本文」キーと新submission:UUID、gratitudeDaysの日別枠（最大3） |
| dailyGoals | 日付ごとの旧目標（最大3）。earn/undoを繰り返せるためgoalIdだけで取引を重複削除しない |
| fortunes | 日付につき1結果。同日の異なる結果は競合 |
| encounters | UUID付き発見記録。図鑑はここから算出。旧miracle表記も保持 |
| settings | 端末設定。候補には公開側を採用し、必要なら適用後に音声設定を変更 |

公開URLのオリジンは `https://komiki0401.github.io`、ローカルは `http://127.0.0.1:5173`。
`http://localhost:5173` は別の保存先。ポート違い、別ブラウザ、スマホとPCも別々の保存先となる。
スマホのデータはそのスマホで書き出す。PCで公開URLを開いてもスマホの記録は取得できない。

## 1. 両方を先にバックアップ

編集中の下書きは通常の操作で保存する。その後は統合作業完了まで新しい操作をしない。
対象オリジンにつきアプリのタブを1つにする。他のタブも閉じる。localStorageを削除しない。
以下を**データのある実際のブラウザ**の開発者ツールConsoleで実行する。
公開側、ローカル側で1回ずつ実行し、ダウンロードしたJSONが両方そろってから次へ進む。
スマホでConsoleを使えない場合は端末のリモートデバッグを使う。PC側の空データで代用しない。

```js
(() => {
  const key = 'yumekana-shrine:v1';
  const raw = localStorage.getItem(key);
  if (raw === null) throw new Error('このブラウザ・URLには保存データがありません。保存先を確認してください');
  const backup = { key, origin: location.origin, url: location.href,
    exportedAt: new Date().toISOString(), raw };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yumekana-${location.hostname}-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
})();
```

元の文字列をrawとして保存するため、旧形式や未知のフィールドも原本に残る。
JSONを開き、originとrawの存在、ファイルサイズを確認する。書き出しはlocalStorageを変更しない。
公開側を `public.json`、ローカル側を `local.json` として `.local-backups/` 内に保管する。
夢・感謝には私的な文章が含まれる。GitHubへのpushや外部のJSON変換サービスへの貼り付けをしない。

## 2. オフラインで比較して候補を作る

プロジェクト直下で実行する。最後の引数は**存在しない**ディレクトリを指定する。

```powershell
node scripts/merge-storage.mjs .local-backups/public.json .local-backups/local.json .local-backups/data-review-01
```

入力ファイルを出力先に追加コピーし、アプリの `decode` で旧形式を補完・検証して比較する。
元ファイル、ブラウザ、本番サイトには書き込まない。元のバックアップは編集しない。
`report.json` の件数・小判残高・奉納数・ポイントと競合を確認する。
競合がある場合は終了コード2となり、`merged.json` は**作成しない**。
入力不正でもバックアップは残り、候補の出力は停止する。

同じUUID・同じ内容は1件にまとめる。同じUUIDの編集差分は自動で優先しない。
同じ夢への報酬が異なる取引IDで存在する場合は停止する。夢の達成を再実行して報酬を作り直さない。
異なるUUIDの同文の夢や同日の同文の感謝は、別の記録かコピーか区別できないため停止する。
別々に行った感謝を本文だけで消してはいけない。感謝の再登録で加点し直さない。
奉納/旧目標取引を含め双方が分岐した場合も停止する。取引に時刻や共通祖先情報がなく、同じ小判を両側で使った可能性を判定できないため。
負残高を打ち消す架空の獲得取引を追加しない。

ポイント履歴が一方を包含し累計も減らない場合だけ、その側の累計を採用する。
双方に独立した加点がある場合は停止する。`max` や合計で独立した加点や旧履歴の重複を推測しない。
日別枠も単純加算しない。原本の記録とsubmissionキーを確認し、同日の有効な加点を最大3件に整理する。
旧 `日付|本文` と新 `submission:UUID` は同じ奉納を指すことがあるので別の加点として数えない。
過去の累計と現在の記録件数の差を勝手に再計算して減らさない。

競合時は `report.json` の各pathについて、原本を根拠に残す値・同一イベントか独立イベントか・採用する加点を決める。
判断結果は別のファイルに残す。根拠のない競合解消はせず、その場合は2つの原本を保管したまま中断する。
確認済みの判断に基づき**コピー側**を調整して別の出力ディレクトリで再実行する。
候補の全内容も比較する。削除履歴がないため、片側で削除した夢などが再登場する場合がある。
このツールは自動同期システムではない。

## 3. ローカルで候補を試す

競合ゼロでも、まだ自動適用しない。まず候補とレポートを確認する。
候補を別の使い捨てブラウザプロファイルのローカルサイトに読み込み、夢・達成履歴・感謝・図鑑・残高・奉納数を確認すると安全。
試験中のアプリ操作が保存されても、それを元の候補へ逆輸入しない。

## 4. 適用直前にもバックアップし、候補を読み込む

対象のサイト・ブラウザを開き、手順1をもう一度実行する。
その新しいバックアップも実際にダウンロードされていることを確認する。
新バックアップのrawが統合元のrawと違う場合は、途中でデータが変わっているため、最新2ファイルで手順2からやり直す。

次のConsoleコードを**適用先のサイトで**実行し、確認済みの `merged.json` を選ぶ。
公開・ローカル両方を揃える場合、それぞれのブラウザでバックアップと読み込みを行う。
バックアップJSONではなく、候補のmerged.jsonを選ぶこと。

```js
(() => {
  const key = 'yumekana-shrine:v1';
  const before = localStorage.getItem(key);
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = async () => {
    try {
      const file = input.files?.[0]; if (!file) return;
      const raw = await file.text(); const d = JSON.parse(raw);
      if (d.version !== 1 || !Array.isArray(d.dreams) || !Array.isArray(d.transactions) ||
          !Array.isArray(d.gratitudes) || !d.spiritCredits || !d.settings) throw new Error('候補ファイルの形式が違います');
      if (localStorage.getItem(key) !== before) throw new Error('選択中に保存データが更新されました。再バックアップが必要です');
      const balance = d.transactions.reduce((n, t) => n + t.amount, 0);
      if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('残高を確認してください');
      if (!confirm(`${location.origin}\n夢${d.dreams.length}件 / 感謝${d.gratitudes.length}件 / 小判${balance}枚\n両側のバックアップ・競合ゼロ・内容確認は完了しましたか？`)) return;
      // Additional same-origin rollback copy. Downloaded backups remain authoritative.
      if (before !== null) localStorage.setItem(`${key}:before-import:${Date.now()}`, before);
      localStorage.setItem(key, raw);
      if (localStorage.getItem(key) !== raw) throw new Error('保存内容が一致しません');
      location.reload();
    } catch (error) { console.error(error); alert(String(error)); }
  };
  input.click();
})();
```

候補の詳細検証は手順2のdecodeで実施済みであることが前提。
適用後、保存エラーがないこととレポートとの一致を確認し、もう一度書き出して完成データを保存する。
同一候補を再適用しても同じ取引UUIDのままなので報酬・奉納は増えない。
以降は主に使うスマホ・ブラウザを決める。別オリジンでそれぞれ操作すると再び分岐する。

## 戻す場合

適用先ブラウザの操作を止め、その時点のデータも書き出す。
同じオリジンの適用直前バックアップをファイル選択で読み、envelopeのoriginがlocation.origin、keyが保存キーであることを確認する。
`JSON.parse(fileText).raw` を元の保存キーにsetItemして再読み込みする（バックアップ全体のJSONは保存しない）。
異なるオリジンの原本を復旧先に取り違えない。ブラウザの全データ消去は不要。

**今回実行したのはソースのバックアップ・比較・マージと、統合用ツール/手順の準備まで。実際のブラウザデータの取得・変更はしていない。**
