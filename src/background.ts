chrome.commands.onCommand.addListener((command) => {
  if (command === "run-automation") {
    // アクティブなタブの取得
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        // content.jsの注入
        chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"]
        });
      }
    });
  }
});

/** キーチェーンからシークレットを取得する際に指定するネイティブホスト名 */
const NATIVE_HOST_NAME = 'com.my.native_host';

/** 対象とするポータルサイトのオリジンURL */
const TARGET_ORIGIN = "https://portal.nap.gsic.titech.ac.jp";

/**
 * ネイティブメッセージングを用いてOSのキーチェーンからシークレット情報を取得する。
 * 
 * 参考:
 * - https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging?hl=ja
 * 
 * @returns {Promise<any>} キーチェーンから取得した情報を解決するPromise。
 */
async function getSecretFromOS() {
  return new Promise((resolve, reject) => {
    // ネイティブホスト名（マニフェストのname）を指定
    chrome.runtime.sendNativeMessage(
      NATIVE_HOST_NAME,
      { type: 'GET_SECRET' },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response && response.success) {
          // 成功時、データを返す
          resolve(response.data);
        } else {
          // 失敗時、エラーを返す
          reject(response ? response.error : "応答なし");
        }
      }
    );
  });
}

/**
 * content scriptからのメッセージを捕捉し、要求に応じた情報を返すリスナー。
 * 不正なURLからの要求ブロックや、要求内容に基づく部分的なデータ送信を担う。
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_CONFIG") {
    // 送信元のタブURLを確認
    if (sender.tab?.url && !sender.tab.url.startsWith(TARGET_ORIGIN)) {
      console.warn("不正なリクエスト元からの通信をブロック:", sender.tab.url);
      sendResponse({ error: "不正なリクエスト元です" });
      return false;
    }

    getSecretFromOS()
      .then((config: any) => {
        console.log("安全に取得完了");

        if (request.requestType === "PASSWORD") {
          sendResponse({
            STUDENT_ID: config.STUDENT_ID,
            PASSWORD: config.PASSWORD
          });
        } else if (request.requestType === "MATRIX") {
          // 空のマトリクスを作成し、要求された箇所だけ埋める
          const partialMatrix = Array(10).fill(null).map(() => Array(7).fill(null));

          if (request.labels && Array.isArray(request.labels)) {
            request.labels.forEach((label: any) => {
              const charIndex = label.char.charCodeAt(0) - 'A'.charCodeAt(0);
              const numIndex = label.num - 1;
              if (config.MATRIX_CODE && config.MATRIX_CODE[charIndex] && config.MATRIX_CODE[charIndex][numIndex] !== undefined) {
                partialMatrix[charIndex][numIndex] = config.MATRIX_CODE[charIndex][numIndex];
              }
            });
          }
          sendResponse({ MATRIX_CODE: partialMatrix });
        } else {
          sendResponse({ error: "不明な requestType です" });
        }
      })
      .catch(err => {
        console.error("設定の取得に失敗:", err);
        sendResponse({ error: err.message });
      });
    return true; // 非同期応答のため
  }
});