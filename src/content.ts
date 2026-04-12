// import { STUDENT_ID, PASSWORD, MATRIX_CODE } from '../config.secret';

/**
 * 要素が文字列またはnullである二次元配列を表す型。
 * 要求されていないマトリクス座標にはnullが格納される想定。
 */
type MatrixCode = (string | null)[][];

/**
 * ネイティブホストから取得したシークレット情報を格納するインターフェース。
 */
interface Config {
  STUDENT_ID?: string;
  PASSWORD?: string;
  MATRIX_CODE?: MatrixCode;
}

// メイン処理の起動とセキュリティチェック

/** 対象とするポータルサイトのオリジンURLを表す定数。 */
const TARGET_ORIGIN = "https://portal.nap.gsic.titech.ac.jp";

// 意図しないURLでの実行を防止する
if (window.location.origin === TARGET_ORIGIN) {
  const url = window.location.href;
  let requestPayload: any = { type: "FETCH_CONFIG" };

  if (url.includes('AUTHMETHOD=UserPassword')) {
    requestPayload.requestType = "PASSWORD";
  } else if (url.includes('AUTHMETHOD=IG') || document.querySelector('#authentication')) {
    requestPayload.requestType = "MATRIX";
    requestPayload.labels = getRequiredLabels();
  }

  // メッセージを送って設定を取得してからメイン処理を実行
  chrome.runtime.sendMessage(requestPayload, (response: Config | { error: string }) => {
    if (chrome.runtime.lastError) {
      console.error("Backgroundとの通信エラー:", chrome.runtime.lastError.message);
      return;
    }
    if (response && 'error' in response) {
      console.error("設定の取得失敗:", response.error);
      return;
    }
    
    if (response) {
      main(response as Config);
    } else {
      console.error("Backgroundスクリプトからの応答なし。");
    }
  });
} else {
  console.warn("Auto Matrix Code: 対象URLではないため、処理を終了します:", window.location.origin);
}

/**
 * 取得した設定情報をもとにパスワード入力またはマトリクス入力へ処理を分岐する。
 * @param {Config} config - ネイティブホストから取得した設定値群。
 */
function main(config: Config) {
  const { STUDENT_ID, PASSWORD, MATRIX_CODE } = config;

  // 現在のURLの取得
  const url = window.location.href;
  console.log('現在のURL:', url);

  if (url.includes('AUTHMETHOD=UserPassword')) {
    // ユーザー名・パスワードによる認証
    if (STUDENT_ID && PASSWORD) {
      handleUserPassword(STUDENT_ID, PASSWORD);
    }
  } else if (url.includes('AUTHMETHOD=IG') || document.querySelector('#authentication')) {
    // マトリクスコードによる認証
    if (MATRIX_CODE) {
      handleMatrixCode(MATRIX_CODE);
    }
  }
}

/**
 * 学生番号とパスワードをDOM要素に入力し、フォームを送信する。
 * @param {string} studentId - 入力する学生番号。
 * @param {string} password - 入力するパスワード。
 */
function handleUserPassword(studentId: string, password: string) {
  console.log('学籍番号,パスワードの入力を開始');

  // DOM要素の取得
  const idInput = document.querySelector('body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > input[type=text]') as HTMLInputElement;
  const passInput = document.querySelector('body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > input[type=password]') as HTMLInputElement;
  const submitBtn = document.querySelector('body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(1)') as HTMLInputElement;

  if (idInput && passInput && submitBtn) {
    if (studentId && password) {
      // 値の入力と送信
      idInput.value = studentId;
      passInput.value = password;
      setTimeout(() => {
        submitBtn.click();
        console.log("学籍番号,パスワードの入力を完了");
      }, 500);
    } else {
      console.warn("STUDENT_ID, PASSWORD が取得できませんでした。");
    }
  } else {
    console.error("入力対象が見つかりませんでした。");
  }
}

/**
 * 要求されたマトリクス座標をもとにマトリクスコードをDOM要素に入力し、フォームを送信する。
 * @param {MatrixCode} matrixCode - 取得したマトリクスコードを含む二次元配列。
 */
function handleMatrixCode(matrixCode: MatrixCode) {
  console.log('マトリクスコードの入力を開始');

  const labels = getRequiredLabels();

  labels.forEach(({ rowIndex, char, num, charIndex, numIndex }) => {
    const inputSelector = `#authentication > tbody > tr:nth-child(${rowIndex}) > td > input[type=password]`;
    const input = document.querySelector(inputSelector) as HTMLInputElement;

    if (input) {
      console.log(`${rowIndex}行目のラベル: [${char},${num}]`);

      // nullは取得対象外であったことを意味する。(不正な取得)
      if (matrixCode[charIndex] && matrixCode[charIndex][numIndex] !== undefined && matrixCode[charIndex][numIndex] !== null) {
         const val = matrixCode[charIndex][numIndex];
         // 値の入力
         input.value = val as string;
         console.log(`【入力】[${char},${num}]`);
      } else {
        console.error(`[${char},${num}]が見つかりませんでした。`);
      }
    }
  });

  const submitBtnSelector = '#authentication > tbody > tr:nth-child(9) > td > input[type=submit]:nth-child(1)';
  const submitBtn = document.querySelector(submitBtnSelector) as HTMLInputElement;
  if (submitBtn) {
    setTimeout(() => {
      submitBtn.click();
      console.log("マトリクスコードの入力を完了");
    }, 500);
  }
}

/**
 * DOMを解析し、現在入力が求められているマトリクスコードの座標情報一覧を取得する。
 * @returns {Array} 座標の文字、数字、DOMの行番号、配列インデックスを含むオブジェクトの配列。
 */
function getRequiredLabels() {
  /** マトリクスコード入力欄が存在するDOMの行番号（`tr`要素のインデックス）を表す定数。 */
  const MATRIX_ROWS = [5, 6, 7];
  const labels: { char: string, num: number, rowIndex: number, charIndex: number, numIndex: number }[] = [];
  MATRIX_ROWS.forEach(rowIndex => {
    const thSelector = `#authentication > tbody > tr:nth-child(${rowIndex}) > th:nth-child(1)`;
    const th = document.querySelector(thSelector);
    if (th) {
      const label = th.textContent?.trim();
      const match = label?.match(/\[([A-J]),([1-7])\]/);
      if (match) {
        const char = match[1];
        const num = parseInt(match[2], 10);
        labels.push({
          char,
          num,
          rowIndex,
          charIndex: char.charCodeAt(0) - 'A'.charCodeAt(0),
          numIndex: num - 1
        });
      }
    }
  });
  return labels;
}