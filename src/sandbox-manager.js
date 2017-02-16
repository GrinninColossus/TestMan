/** Class for managing BrowserWindow scaling modes, events, and any other toolbar functions */
class SandboxManager {

	/** @constructor */
	constructor(){

		this.canvasWidth = 1;
		this.canvasHeight = 1;
		this.aspectRatio = 1;
		this.toolbarOffset = 50 + (window.outerHeight - window.innerHeight);
		this.scaleMode = 'fit';	//Flags window current scale mode
		this.returnScaleMode = 'toFit';	//Flags scale mode to return to after exiting full-screen mode
		
		this.server = undefined;	//Reference to active HTTP server
		this.connections = {};	//Object collection of Socket objects for all active connections
		this.socketID = 0;

		this.sandboxWin = remote.getCurrentWindow();	//Reference to electron BrowserWindow
		this.sandboxWin.setMaximizable(false);
		this.sandboxWin.setResizable(false);

	}

	/** Init event listeners for the sandbox toolbar */
	init(){
		var _this = this;

		document.getElementById('btn-reload').addEventListener('click', this.reloadWebview.bind(this));
		document.getElementById('radio-fit').addEventListener('click', this.toFit.bind(this));
		document.getElementById('radio-full').addEventListener('click', this.toFull.bind(this));

		document.getElementById('4:3').addEventListener('click', function(){ this.toRatio(4, 3); }.bind(this));
		document.getElementById('16:9').addEventListener('click', function(){ this.toRatio(16, 9); }.bind(this));
		document.getElementById('16:10').addEventListener('click', function(){ this.toRatio(16, 10); }.bind(this));
		document.getElementById('3:2').addEventListener('click', function(){ this.toRatio(3, 2); }.bind(this));
		document.getElementById('8:5').addEventListener('click', function(){ this.toRatio(8, 5); }.bind(this));
		document.getElementById('5:3').addEventListener('click', function(){ this.toRatio(5, 3); }.bind(this));

		/** Hides and unhides modal */
		document.getElementById('btn-cancel-modal').addEventListener('click', function(){ 
			document.getElementById('modal').style.visibility = 'hidden';
		 }.bind(this));

		document.getElementById('custom-ratio').addEventListener('click', function(){ 
			document.getElementById('modal').style.visibility = 'visible';
		 }.bind(this));

		/** Sets custom aspect ratio size */
		document.getElementById('btn-accept-modal').addEventListener('click', function(){ 

			var width = document.getElementById('input-width').value;
			var height = document.getElementById('input-height').value;
			document.getElementById('modal').style.visibility = 'hidden';

			this.toRatio(width, height);

		 }.bind(this));

		/** Opens the dev tools for the webview */
		document.getElementById('link-openDevTools').addEventListener('click', function(){ 
			document.getElementById('sandbox-webview').openDevTools();
		});

		/** Clears local storage for electron BrowserWindow as well as the webview */
		document.getElementById('link-clearLocal').addEventListener('click', function(){
			localStorage.clear();
			document.getElementById('sandbox-webview').executeJavaScript("localStorage.clear();");

			toastr.success("Local storage cleared");
		});

		/** Allows escape key to be used to leave full-screen and returns scale-mode to what it was previously */
		document.addEventListener('keydown', function(event){
			if (event.key == 'Escape'){
				_this.sandboxWin.setFullScreen(false);
				_this[_this.returnScaleMode]();
			}
		});

		/** Opens the webview content in the browser */
		document.getElementById('ipLabel').addEventListener('click', function(e){
			e.preventDefault();
			shell.openExternal('http://'+this.href, {active: true});

			toastr.success("Opened in browser");
		});
	}

	/**
	 * Attempts to close all open connections on the active server so that the same port can be used again
	 * @param {String} localPath - Passed to initLocalHost upon success
	 * @param {Number} port - Pass to initLocalHost upon success
	 */
	closeExistingConnections(localPath, port){
		
		//The server is null if this is 
		if (this.server) { 
			this.server.close()
			this.server = null;

			var socketKeys = Object.keys(this.connections);
			for (var i = 0; i < socketKeys.length; i++){
				this.connections[socketKeys[i]].destroy();
			}

		} else {
			return;
		} 

		//Repeat check until all socket connections are closed, then proceed to initLocalHost
		if (Object.keys(this.connections).length > 0){

			setTimeout(function(){

				console.log("Timeout...");

				this.closeExistingConnections(localPath, port);

			}.bind(this), 100);

		} else {

			this.initLocalHost(localPath, port);

		}

	}

	/**
	 * Creates a simple http server which will will listen on a given port, or if that port is busy use the first free port found
	 * @param {String} localPath - The path to the directory from which content will be served 
	 * @param {Number} port - The port on which to serve the content in the given directory
	 */
	initLocalHost(localPath, port){
		this.closeExistingConnections(localPath, port);

		var express = require('express');
		var app = express();

		var _this = this;
		var listenOn = port;

		//Set static directory from which to server content
		app.use(express.static(path.parse(localPath).dir));

		//Set up the server, try next port if the current one is busy
		this.server = app.listen(listenOn, "0.0.0.0", 511, function(){

			var ipLabel = document.getElementById('ipLabel');
			var ipPlusPort = ip.address() + ":" + listenOn;
			ipLabel.innerHTML = ipPlusPort;
			ipLabel.href = ipPlusPort;

		}).on('error', function(err){
			
			_this.initLocalHost(localPath, listenOn + 80);

		});

		//On each connection event, add the socket to the connections collection object
		//and subscribe to 'close' event, at which point the socket will remove its own reference from the collection
		this.server.on('connection', function(socket){
			var socketID = 'socket'+ _this.socketID++;

			_this.connections[socketID] = socket;
			socket.setKeepAlive(true);

			socket.on('close', function(){
				delete _this.connections[socketID];
			});
		});

	}


	/**
	 * Asynchronously fetches width/height of first canvas found in the sandbox webveiw, passes both as callback params 
	 * @callback requestCallback
	 * @param {Object} context - the callback context
	 */
	getCanvasScaleRatio(callback, context){

		var _this = this;
		document.getElementById('sandbox-webview').executeJavaScript("document.getElementsByTagName('canvas')[0].width", function(width){
		//	var w = width;

			document.getElementById('sandbox-webview').executeJavaScript("document.getElementsByTagName('canvas')[0].height", function(height){
			//	var h = height + (height * (53 / window.outerHeight)); //53 is a magic-ish number to compenstate for 50px webview offset

				if (callback){
					if (!context) {context = _this;}

					callback.apply(context, [width, height]);

				}

			}, this);

		}, this);
	}

	/** Changes browser window to 'Fit' mode, which uses the canvas aspect ratio  */
	toFit(){

		this.getCanvasScaleRatio(function(width, height){

			this.toRatio(height, width);

			this.sandboxWin.setTitle("TestMan - FIT");
			this.scaleMode = 'fit';

		}, this);
		
	}

	/** Changes browser window to 'Full' mode, which puts the browser window into full-screen */
	toFull(){
		this.sandboxWin.setResizable(true);
		this.sandboxWin.setFullScreen(true);

		var webview = document.getElementById('sandbox-webview');
			webview.insertCSS('canvas {margin: auto !important;}');

		var wrapper = document.getElementById('webview-wrapper');
			wrapper.style.width = '100vw';
			wrapper.style.height = 'calc(100vh - 50px)';

		this.sandboxWin.setTitle("TestMan - FULL");
		this.scaleMode = 'full';
	}

	/**
	 * Sets window size to given aspect ratio, height is automatically set to use 80% of avialable screen height
	 * @param {Number} width
	 * @param {Number} height
	 */
	toRatio(width, height){
		this.sandboxWin.setFullScreen(false);
		this.sandboxWin.setResizable(false);

		this.aspectRatio = height / width;
		var percentOfScreen = .80;	//Amount of screen space to take up

		var webview = document.getElementById('sandbox-webview');
			webview.insertCSS('canvas {margin: auto !important;}');
			webview.style.width = "100%";
			webview.style.height = "100%";

		var wrapper = document.getElementById('webview-wrapper');
			wrapper.style.height = (window.screen.height * percentOfScreen) + 'px';
			wrapper.style.width = ((window.screen.height * percentOfScreen) * this.aspectRatio) + 'px';

			window.resizeTo(((window.screen.height * percentOfScreen) * this.aspectRatio), (window.screen.height * percentOfScreen) + this.toolbarOffset);
		
		this.sandboxWin.setTitle("TestMan - " + width + ":" + height);
		this.scaleMode = 'ratio';
	}

	/** Changes browser window to 'Fixed' mode, which allows the user to determine the exact dimensions of the browser window */
	toFixed(){
		this.sandboxWin.setFullScreen(false);
		this.scaleMode = 'fixed';
	}

	/** Triggers a webview reload */
	reloadWebview(){
		var webview = document.getElementById('sandbox-webview');
			webview.loadURL(webview.src);
	}


}