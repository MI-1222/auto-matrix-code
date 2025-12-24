// import { STUDENT_ID, PASSWORD, MATRIX_CODE } from '../config.secret';

type MatrixCode = string[][];

interface Config {
  STUDENT_ID: string;
  PASSWORD: string;
  MATRIX_CODE: MatrixCode;
}

// メッセージを送って設定を取得してからメイン処理を実行
chrome.runtime.sendMessage({ type: "FETCH_CONFIG" }, (response: Config | { error: string }) => {
  if (chrome.runtime.lastError) {
    console.error("Backgroundとの通信エラー:", chrome.runtime.lastError.message);
    return;
  }
  if ('error' in response) {
    console.error("設定の取得失敗:", response.error);
    return;
  }
  
  if (response) {
    main(response);
  } else {
    console.error("Backgroundスクリプトからの応答なし。");
  }
});

function main(config: Config) {
  const { STUDENT_ID, PASSWORD, MATRIX_CODE } = config;

  // 現在のURLの取得
  const url = window.location.href;
  console.log('現在のURL:', url);

  if (url.includes('AUTHMETHOD=UserPassword')) {
    // ユーザー名・パスワードによる認証
    handleUserPassword(STUDENT_ID, PASSWORD);
  } else if (url.includes('AUTHMETHOD=IG') || document.querySelector('#authentication')) {
    // マトリクスコードによる認証
    handleMatrixCode(MATRIX_CODE);
  }
}

// ユーザー名・パスワード入力処理
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
      submitBtn.click();
      console.log("学籍番号,パスワードの入力を完了");
    } else {
      console.warn("STUDENT_ID, PASSWORD が取得できませんでした。");
    }
  } else {
    console.error("入力対象が見つかりませんでした。");
  }
}

// マトリクスコード入力処理
function handleMatrixCode(matrixCode: MatrixCode) {
  console.log('マトリクスコードの入力を開始');
  const rows = [5, 6, 7];

  rows.forEach(rowIndex => {
    const thSelector = `#authentication > tbody > tr:nth-child(${rowIndex}) > th:nth-child(1)`;
    const inputSelector = `#authentication > tbody > tr:nth-child(${rowIndex}) > td > input[type=password]`;
    const submitBtnSelector = '#authentication > tbody > tr:nth-child(9) > td > input[type=submit]:nth-child(1)';

    const th = document.querySelector(thSelector);
    const input = document.querySelector(inputSelector) as HTMLInputElement;
    const submitBtn = document.querySelector(submitBtnSelector) as HTMLInputElement;

    if (th && input && submitBtn) {
      const label = th.textContent?.trim(); // e.g. "[A,1]"
      console.log(`${rowIndex}行目のラベル: ${label}`);

      if (label) {
        const match = label.match(/\[([A-J]),([1-7])\]/);
        if (match) {
          const char = match[1]; // A-J
          const num = parseInt(match[2], 10); // 1-7

          // インデックスの計算
          const charIndex = char.charCodeAt(0) - 'A'.charCodeAt(0);
          const numIndex = num - 1;

          if (matrixCode[charIndex] && matrixCode[charIndex][numIndex] !== undefined) {
             const val = matrixCode[charIndex][numIndex];
             // 値の入力
             input.value = val;
             console.log(`【入力】[${char},${num}]: ${val}`);
          } else {
            console.error(`[${char},${num}]が見つかりませんでした。`);
          }
        }
      }
    }
    submitBtn.click();
    console.log("マトリクスコードの入力を完了");
  });
}