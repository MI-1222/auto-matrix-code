import { execSync } from 'child_process';
import process from 'process';

// 1. stdout破損防止のためconsole.logをstderrにリダイレクト
console.log = (...args: any[]) => {
  console.error(...args);
};

/** macOSキーチェーンで検索する際のアカウント名およびサービス名 */
const KEYCHAIN_SERVICE_NAME = "auto-matrix-code-secret";

/**
 * 標準入力からバッファを利用してJSONメッセージを安全に読み取る。
 * @returns {Promise<any>} パースされたメッセージオブジェクトを解決するPromise。
 */
function readMessage(): Promise<any> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let buffer = Buffer.alloc(0);
    let expectedLength: number | null = null;

    const processBuffer = () => {
      try {
        // メッセージ長が未定の場合、ヘッダーの読み取りを試行
        if (expectedLength === null) {
          if (buffer.length >= 4) {
            expectedLength = buffer.readUInt32LE(0);
            buffer = buffer.slice(4);
          } else {
            return; // データ不足のため待機
          }
        }

        // メッセージ長が決定済みの場合、本文の読み取りを試行
        if (expectedLength !== null) {
          if (buffer.length >= expectedLength) {
            const content = buffer.slice(0, expectedLength);
            const remaining = buffer.slice(expectedLength);
            
            // 単一メッセージのみ処理
            buffer = remaining; 
            
            const jsonStr = content.toString();
            resolve(JSON.parse(jsonStr));
          }
        }
      } catch (err) {
        reject(err);
      }
    };

    stdin.on('data', (chunk: any) => {
      buffer = Buffer.concat([buffer, chunk]);
      processBuffer();
    });

    stdin.on('end', () => {});
    stdin.on('error', (err) => {
       reject(err);
    });
  });
}

/**
 * 標準出力へ長さを付与したJSONメッセージを書き込み、Chrome拡張機能へ送信する。
 * @param {any} msg - 送信するメッセージオブジェクト。
 */
function sendMessage(msg: any) {
  const buffer = Buffer.from(JSON.stringify(msg));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  process.stdout.write(header);
  process.stdout.write(buffer);
}

/**
 * ネイティブホストのメイン処理。
 * 標準入力からリクエストを受け取り、macOSのキーチェーンへアクセスして認証情報を返す。
 */
async function main() {
  process.on('uncaughtException', (err) => {
    console.error('未捕捉のエラー:', err);
    sendMessage({ success: false, error: `未捕捉のエラー: ${err.message}` });
    process.exit(1);
  });

  try {
    const message = await readMessage();

    if (message.type === 'GET_SECRET') {
      try {
        // macOSキーチェーン アクセス
        const stdout = execSync(
          `security find-generic-password -s "${KEYCHAIN_SERVICE_NAME}" -w`,
          { stdio: ['ignore', 'pipe', 'pipe'] } // stderrの破棄防止
        );
        let jsonString = stdout.toString().trim();
        // 末尾のカンマ削除
        jsonString = jsonString.replace(/,(\s*[\]}])/g, '$1');
        const secretData = JSON.parse(jsonString);
        sendMessage({ success: true, data: secretData });
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        const stderr = error.stderr ? error.stderr.toString() : '';
        console.error('キーチェーンエラー:', errorMessage, stderr); 
        sendMessage({ success: false, error: 'キーチェーンアクセス失敗', details: errorMessage });
      }
    }
  } catch (err: any) {
    console.error('致命的なエラー:', err);
    process.exit(1);
  }
}

main();
