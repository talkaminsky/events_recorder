if(!window.recorder_loaded) {
	let Recorder = class Recorder {
	  constructor(type, element, data) {
	    this._type = type;
	    this._element = element;
	    this._data = data;

	    if(!this._data[this._type]) {
	      this._data[this._type] = [];
	    }

	    const t = new Date().getTime();
	    this._data['page'] = [{t, event: { eventType:'loaded', location:  window.location.href}}];
	  }
	  
	  _record(input, msg) {
			const t = new Date().getTime();
			chrome.runtime.sendMessage({type: "recorder", options: { 
				type: "record",
				time: t,
				event: input 
			}});
	    this._data[this._type].push({t, event: input});
	  }
	  
	  _startStop(start) {
	    const addOrRemoveEventListener = (start ? 'add' : 'remove') + 'EventListener';
	   
	    for( let eventName of Object.keys(this._handlers)) {
	      this._element[addOrRemoveEventListener](eventName, this._handlers[eventName]);
	    }
	  }

	  _getXPathForElement(element) {
	    const idx = (sib, name) => sib 
	        ? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name)
	        : 1;
	    const segs = elm => !elm || elm.nodeType !== 1 
	        ? ['']
	        : elm.id && document.querySelector(`#${elm.id}`) === elm
	            ? [`id("${elm.id}")`]
	            : [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
	    return segs(element).join('/');
	  }
	  
	  start() {
	    this._startStop(true);
	  }
	  
	  stop() {
	    this._startStop(false);
	  }
	}

	let KeyboardRecorder = class KeyboardRecorder extends Recorder{
	  constructor() {
	    super('keyboard', ...arguments);
	    this._handlers = {
	      keydown: this._handleKeyDown.bind(this)
	     };
	  }

	  _handleKeyDown(e) {
	    e.xpath = this._getXPathForElement(e.target);
	    e.eventType = 'KeyDown';
	    e.char = e.keyCode;
	    this._record(e,'record keydown : '+ String.fromCharCode(e.keyCode));
	  }
	  
	}

	let MouseRecorder = class MouseRecorder extends Recorder{
	  constructor() {
	    super('mouse', ...arguments);
	    this._lastScroll = document.body.scrollTop;
	    this._newScroll;

	    this._handlers = {
	      click: this._handleClick.bind(this),
	      dblclick: this._handleDblClick.bind(this),
	      scroll: this._handleScroll.bind(this)
	     };
	  }
	  
	  
	  _handleClick(e) {
	    e.xpath = this._getXPathForElement(e.target);
	    e.eventType = e.type;
	    this._record(e,'record click');
	  }
	  
	  _handleDblClick(e) {
	    e.xpath = this._getXPathForElement(e.target);
	    e.eventType = e.type;
	    this._record(e,'record dblclick');
	  }

	  _handleScroll(e) {
	    this._newScroll = document.documentElement.scrollTop;
	    e.newScroll = document.documentElement.scrollTop;
	    e.gap = this._newScroll - this._lastScroll;
	    e.element = e.target
	    e.eventType = 'scroll';
	    this._lastScroll = this._newScroll;
	    
	    this._record(e,'record scroll');
	  }
	}

	let App = class App {

	  constructor(params = {}) {
	    this._container = params.container;
	    this._data = {};
	    this._isRecording = false;
	    this._keyboardRecorder = new KeyboardRecorder(this._container, this._data);
			this._mouseRecorder = new MouseRecorder(this._container, this._data);
			this._tabId = 0

			window.onbeforeunload = (event) => {
				chrome.runtime.sendMessage({type: "recorder", options: { 
					type: "unloaded",
					tabId: this._tabId,
					data: this.getRecorderData()
				}});
			}
			
			chrome.runtime.sendMessage({type: "recorder", options: { 
				type: "loaded"
			}}, (response) => {
				this._tabId = response.tabId;
				if(response.shouldContinueRecording) {
					this.continueRecording();
				}
			});
	  }
	  
	  startRecording() {
			console.log('Start Recording');
			chrome.runtime.sendMessage({type: "recorder", options: { 
				type: "session_started",
				tabId: this._tabId
			}});

	    this._keyboardRecorder.start();
			this._mouseRecorder.start();
	    this._isRecording = true;
		}
		
		continueRecording() {
			console.log('Continue Recording');
	    this._keyboardRecorder.start();
			this._mouseRecorder.start();
	    this._isRecording = true;
	  }

	  stopRecording() {
			console.log('Stop Recording');
			chrome.runtime.sendMessage({type: "recorder", options: { 
				type: "session_ended",
				tabId: this._tabId,
				data: this.getRecorderData()
			}});
			this._keyboardRecorder.stop();
			this._mouseRecorder.stop();
			this._isRecording = false;
		
		}
		
		getRecorderData() {
			window.recorder_data = this._keyboardRecorder._data;
			return window.recorder_data;
		}

	  isRecording() {
	  	return this._isRecording;
	  }
	}

	window.recorder_api = new App({container: document});
	window.recorder_loaded = true; 
}