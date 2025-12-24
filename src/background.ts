chrome.commands.onCommand.addListener((command) => {
  if (command === "run-automation") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"]
        });
      }
    });
  }
});