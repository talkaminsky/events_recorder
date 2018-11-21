chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({recorder: { tabs : {}}});
});

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher({
    })],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});


var localData = {}
chrome.storage.local.set({data: localData});

chrome.runtime.onSuspend.addListener(() => {})

chrome.runtime.onConnect.addListener(() => {})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "recorder") {
    switch(request.options.type) {
      case("loaded") : {
        var response = {
          tabId: sender.tab.id,
          shouldContinueRecording: localData[sender.tab.id] && localData[sender.tab.id].isRecording
        }
        sendResponse(response);
        break;
      }
      case("unloaded") : {
        pushData(request);
        break;
      }
      case("session_started") : {
        var tabId = request.options.tabId;
        if(tabId) {
          localData[tabId] = { isRecording: true, sessions: []};
          chrome.storage.local.set({data: localData});
        }
        break;
      }
      case("session_ended") : {
        var tabId = request.options.tabId;
        localData[tabId].isRecording = false;
        pushData(request);
        break;
      }
    }
  }
});

function pushData(request) {
  var tabId = request.options.tabId;
  var data = request.options.data;
  if(localData[tabId]) {
    localData[tabId].sessions.push(data);
    chrome.storage.local.set({data: localData});
  }
}

