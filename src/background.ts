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

// OSからシークレット情報を取得する非同期関数
async function getSecretFromOS() {
  return new Promise((resolve, reject) => {
    // ネイティブホスト名（マニフェストのname）を指定
    chrome.runtime.sendNativeMessage(
      'com.my.native_host',
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

// メッセージ受信時のリスナー
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === "FETCH_CONFIG") {
    getSecretFromOS()
      .then(config => {
        console.log("安全に取得完了");
        sendResponse(config);
      })
      .catch(err => {
        console.error("設定の取得に失敗:", err);
        sendResponse({ error: err.message });
      });
    return true; // 非同期応答のため
  }
});