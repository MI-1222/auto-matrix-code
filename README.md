# auto-matrix-code

`Manifest V3`と`Native Messaging`を用いて、macOSのキーチェーンから認証情報を取得し、学生証のマトリクスコードを自動で入力するためのChrome拡張機能。

## 機能

### 1. 学籍番号, パスワードの入力
`https://portal.nap.gsic.titech.ac.jp/GetAccess/Login?Template=userpass_key&AUTHMETHOD=UserPassword`のページに対して、
* `body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > input[type=text]`に学籍番号を入力
* `body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > input[type=password]`にパスワードを入力
* `body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(1)`を押す

### 2. マトリクスコードの入力
`https://portal.nap.gsic.titech.ac.jp/GetAccess/Login?Template=idg_key&AUTHMETHOD=IG&GASF=CERTIFICATE,IG.GRID,IG.TOKENRO,IG.OTP&LOCALE=ja_JP&GAREASONCODE=13&GAIDENTIFICATIONID=UserPassword&GARESOURCEID=resourcelistID2`に続くURLのページに対して、
* 1つ目の入力欄にマトリクスコードを入力
  * `#authentication > tbody > tr:nth-child(5) > th:nth-child(1)`のコンテンツを読み取る。
  * `#authentication > tbody > tr:nth-child(5) > td > input[type=password]`にコンテンツに対応したアルファベットを小文字で入力する。
* 2つ目の入力欄にマトリクスコードを入力
  * `#authentication > tbody > tr:nth-child(6) > th:nth-child(1)`のコンテンツを読み取る。
  * `#authentication > tbody > tr:nth-child(6) > td > input[type=password]`にコンテンツに対応したアルファベットを小文字で入力する。
* 3つ目の入力欄にマトリクスコードを入力
  * `#authentication > tbody > tr:nth-child(7) > th:nth-child(1)`のコンテンツを読み取る。
  * `#authentication > tbody > tr:nth-child(7) > td > input[type=password]`にコンテンツに対応したアルファベットを小文字で入力する。

#### 補足1: マトリクスコードの構造
マトリクスコードは、$10\times7$の行列で構成されている。
要素はアルファベットである。
行はアルファベット(`A`から`J`), 列は数字(`1`から`7`)により指定される。

#### 補足2: コンテンツについて
コンテンツは、アルファベットと数字の組み合わせにより、2次元行列の要素を指定するもの。
例: `[I,1]`, `[H,3]`

## 内部処理フロー

本拡張機能はセキュリティを考慮し、ブラウザ内に認証情報を保存せず、以下のフローで動作します。

1. 拡張機能 (`src/content.ts`): ページ読み込み後、`src/background.ts` に `FETCH_CONFIG` を送信。
2. Native Host 呼び出し (`src/background.ts`): メッセージを受信し、`chrome.runtime.sendNativeMessage` を実行して `com.my.native_host` を呼び出し。
3. ラッパースクリプト (`src/native-host/wrapper.sh`): OS上で起動され、適切な `NODE_PATH` 環境変数を設定して `src/native-host/index.ts` を実行。
4. ホストスクリプト (`src/native-host/index.ts`): macOSのキーチェーン (`security` コマンド) にアクセスし、認証情報をJSONとして返却。
5. 入力実行 (`src/content.ts`): 取得した情報でフォーム入力を行う。
    *   **注意**: 確実な動作のため、入力後ボタンを押す前に **0.5秒の待機時間** を設けています。

## install

### 1. 依存関係のインストールとビルド

```bash
pnpm install
pnpm run build
```
これにより `dist/` ディレクトリに拡張機能本体と `host.cjs` が生成されます。

### 2. 拡張機能の読み込みとID確認

1. Chromeで `chrome://extensions` を開く。
2. 「デベロッパーモード」をONにする。
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、このプロジェクトの `dist` ディレクトリを選択。
4. 表示された`ID`（例: `abcdefghijklmnop...`）をコピーする。

### 3. ネイティブホスト・マニフェストの作成

テンプレートからマニフェストファイルを作成し、設定を行う。

```bash
# プロジェクトルートで実行
cp src/native-host/com.my.native_host.json.template src/native-host/com.my.native_host.json
```

VSCodeなどで `src/native-host/com.my.native_host.json` を開き、以下の内容を編集する:

1. `allowed_origins`: プレースホルダー `PLACEHOLDER_FOR_EXTENSION_ID` を、手順2でコピーした `ID` に置換。
2. `path`: **ラッパースクリプト `wrapper.sh` の絶対パス** を指定する。
    * `node` コマンドのパスを指定しません（引数設定が不要なため）。
    * 例: `/Users/username/path/to/auto-matrix-code/src/native-host/wrapper.sh`

### 4. 環境変数の設定とラッパースクリプトへの権限付与

スクリプトが正しくNode実行環境を見つけられるよう設定します。

1. プロジェクトルートに `.env.example` をコピーして `.env` ファイルを作成する。
    ```bash
    cp .env.example .env
    ```
2. `.env` を開き、 `NODE_PATH` を使用している **`node` コマンドの絶対パス** に書き換える。
    * `which node` コマンドでパスを確認できます。
    * 例: `NODE_PATH="/Users/username/.nvm/versions/node/v23.5.0/bin/node"`
3. 実行権限を付与する。

```bash
chmod +x src/native-host/wrapper.sh
```

### 5. ネイティブホストの登録 (macOS)

```bash
mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
ln -nfsv $(pwd)/src/native-host/com.my.native_host.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.my.native_host.json
```

### 6. キーチェーンへの秘密情報登録

以下のコマンドを編集し、ターミナルで実行して自身の情報を登録する。JSON形式で1行の文字列として登録する必要がある。

```bash
security add-generic-password -a "$USER" -s "auto-matrix-code-secret" -w '{"STUDENT_ID":"あなたの学籍番号","PASSWORD":"あなたのパスワード","MATRIX_CODE":[["コードA1","コードA2",...],["コードB1",...]]}'
```

* `MATRIX_CODE`: `string[][]` 型。10行7列で、`A`行から`J`行、`1`列から`7`列に対応。

※ 更新する場合は `security delete-generic-password -s "auto-matrix-code-secret"` で削除してから再登録するか、`-U` オプションを使用する。

## 動作確認と注意点

* 初回実行時: 拡張機能がネイティブホストを呼び出す際、macOSがアクセス許可を求めてくる場合がある。「常に許可」または「許可」を選択すること。
* ログ確認: 動作しない場合、`/tmp/amc_native_host.log` にログが出力されるため確認すること。
* ショートカット設定: キーボードショートカットで起動しない場合は、Chromeで `chrome://extensions/shortcuts` を開き、本拡張機能のショートカットが正しく割り当てられているか確認すること。
