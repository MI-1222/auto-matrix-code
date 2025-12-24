import { STUDENT_ID, PASSWORD, MATRIX_CODE } from '../config.secret';

main();

function main() {
  const url = window.location.href;
  console.log('現在のURL:', url);

  if (url.includes('AUTHMETHOD=UserPassword')) {
    handleUserPassword();
  } else if (url.includes('AUTHMETHOD=IG') || document.querySelector('#authentication')) {
    handleMatrixCode();
  }
}

function handleUserPassword() {
  console.log('学籍番号,パスワードの入力を開始');

  const idInput = document.querySelector('body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > input[type=text]') as HTMLInputElement;
  const passInput = document.querySelector('body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > input[type=password]') as HTMLInputElement;
  const submitBtn = document.querySelector('body > center:nth-child(5) > form > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(1)') as HTMLInputElement;

  if (idInput && passInput && submitBtn) {
    if (STUDENT_ID && PASSWORD) {
      idInput.value = STUDENT_ID;
      passInput.value = PASSWORD;
      submitBtn.click();
      console.log("学籍番号,パスワードの入力を完了");
    } else {
      console.warn("STUDENT_ID, PASSWORD が設定されていません。config.secret.tsを確認してください。");
    }
  } else {
    console.error("入力対象が見つかりませんでした。");
  }
}

function handleMatrixCode() {
  console.log('マトリクスコードの入力を開始');
  const rows = [5, 6, 7];

  rows.forEach(rowIndex => {
    const thSelector = `#authentication > tbody > tr:nth-child(${rowIndex}) > th:nth-child(1)`;
    const inputSelector = `#authentication > tbody > tr:nth-child(${rowIndex}) > td > input[type=password]`;

    const th = document.querySelector(thSelector);
    const input = document.querySelector(inputSelector) as HTMLInputElement;

    if (th && input) {
      const label = th.textContent?.trim(); // e.g. "[A,1]"
      console.log(`Row ${rowIndex} label: ${label}`);

      if (label) {
        const match = label.match(/\[([A-J]),([1-7])\]/);
        if (match) {
          const char = match[1]; // A-J
          const num = parseInt(match[2], 10); // 1-7

          const charIndex = char.charCodeAt(0) - 'A'.charCodeAt(0);
          const numIndex = num - 1;

          if (MATRIX_CODE[charIndex] && MATRIX_CODE[charIndex][numIndex] !== undefined) {
             const val = MATRIX_CODE[charIndex][numIndex];
             input.value = val;
             console.log(`【入力】[${char},${num}]: ${val}`);
          } else {
            console.error(`[${char},${num}]が見つかりませんでした。`);
          }
        }
      }
    }
  });
}