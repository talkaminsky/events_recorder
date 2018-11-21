var playStop = document.getElementById('start-stop');
var playStopIcon = document.getElementById('start-stop-icon');
var download = document.getElementById('download');
var isPlay = false;


chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.executeScript(
    tabs[0].id,
    {
      code: "recorder_api.isRecording()"
    }, 
    (result) => {
      isPlay = result[0];
      isPlay ? setStopMode() : setPlayMode();
    }
  );
});

playStop.onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

    isPlay = !isPlay;
    isPlay ? setStopMode() : setPlayMode();

    chrome.tabs.executeScript(
      tabs[0].id,
      {
        code: "recorder_api._isRecording ? recorder_api.stopRecording() : recorder_api.startRecording(); "
      }
    );
  });
}

download.onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.storage.local.get('data', (result) => {
      console.log(result.data[tabs[0].id]);
    });
  });
}

function setPlayMode() {
  playStopIcon.classList.add("fa-play");
  playStopIcon.classList.remove("fa-stop");
  playStop.classList.add("green");
  playStop.classList.remove("red");
}

function setStopMode() {
  playStopIcon.classList.add("fa-stop");
  playStopIcon.classList.remove("fa-play");
  playStop.classList.add("red");
  playStop.classList.remove("green");
}