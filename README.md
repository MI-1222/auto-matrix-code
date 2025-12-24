# auto-matrix-code

学生証のマトリクスコードを自動で入力するためのChrome拡張機能。

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

#### 補足3: マトリクスコードの保存場所について
`config.matrix-code.ts`の`MATRIX_CODE`に`string[][]`として保存する。


例: `[I,1]`, `[H,3]`