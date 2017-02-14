/** Class for managing BrowserWindow scaling modes, events, and any other toolbar functions */
class SandboxManager {

	/** @constructor */
	constructor(contentPath){

		this.scaleRatio = 1;
		this.canvasWidth = 1;
		this.canvasHeight = 1;
		this.scaleMode = 'fit';	//Flags window current scale mode
		this.returnScaleMode = 'toFit';	//Flags scale mode to return to after exiting full-screen mode
		this.fixedSize = {width: 500, height: 500}	//Keeps track of user-defined fixed window size
		this.sandboxWin = remote.getCurrentWindow();	//Reference to electron BrowserWindow

	}

	/** Init event listeners for the sandbox toolbar */
	init(){

		window.addEventListener('resize', this.onResize.bind(this));
		document.getElementById('btn-reload').addEventListener('click', this.reloadWebview.bind(this));
		document.getElementById('radio-fit').addEventListener('click', this.toFit.bind(this));
		document.getElementById('radio-full').addEventListener('click', this.toFull.bind(this));
		document.getElementById('radio-fixed').addEventListener('click', this.toFixed.bind(this));

		var _this = this;

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

	/** Adds the current project to the recent projects object in localStorage */
	addToRecent(contentPath){
		if (!localStorage.recent) { 
			var recent = JSON.parse(localStorage.recent);
		} else {
			var recent = [];
		}

		var title = document.getElementById('sandbox-webview').getTitle();

		recent.push({title: title, path: contentPath});

		localStorage.setItem('recent', JSON.stringify(recent));
	}

	/**
	 * Creates a simple http server which will will listen on a given port, or if that port is busy use the first free port found
	 * @param {String} localPath - The path to the directory from which content will be served 
	 * @param {Number} port - The port on which to serve the content in the given directory
	 */
	initLocalHost(localPath, port){

		var _this = this;
		var listenOn = port;

		app.use(express.static(path.parse(localPath).dir));
		app.use(express.static(path.join(path.parse(localPath).dir, '/FOLDERTOHTMLFILESTOSERVER')));
		app.listen(listenOn, "0.0.0.0", 511, function(){
			console.log("Listening on port " + listenOn);

			var ipLabel = document.getElementById('ipLabel');
			var ipPlusPort = ip.address() + ":" + listenOn;
			ipLabel.innerHTML = ipPlusPort;
			ipLabel.href = ipPlusPort;

		}).on('error', function(err){
			
			_this.initLocalHost(localPath, listenOn + 80);

		});
	}

	/**
	 * Reduces width/height by 15% until the both will fit within the available screen 
	 * @param {Number} width 
	 * @param {Number} height
	 * @param {Number} padding - Amount of extra space to consider as part of the width/height\
	 * @return {Object} - New width/height measurement
	 */
	getBounds(width, height, padding){

		if (width > (window.screen.width - padding) || height > (window.screen.height - padding)) {
			return this.getBounds(width * .80, height * .80, padding);
		}

		return { width: width, height: height }
	}

	/**
	 * Asynchronously fetches width/height of first canvas found in the sandbox webveiw, passes both as callback params 
	 * @callback requestCallback
	 * @param {Object} context - the callback context
	 */
	getCanvasScaleRatio(callback, context){

		var _this = this;
		document.getElementById('sandbox-webview').executeJavaScript("document.getElementsByTagName('canvas')[0].width", function(width){
			var w = width;

			document.getElementById('sandbox-webview').executeJavaScript("document.getElementsByTagName('canvas')[0].height", function(height){
				var h = height + (height * (53 / window.outerHeight)); //53 is a magic-ish number to compenstate for 50px webview offset

				if (callback){
					if (!context) {context = _this;}

					callback.apply(context, [width, height]);

				}

			}, this);

		}, this);
	}

	/** Changes browser window to 'Fit' mode, which wraps around the canvas */
	toFit(){
		this.sandboxWin.setFullScreen(false);

		var _this = this;
		this.getCanvasScaleRatio(function(width, height){

			_this.canvasWidth = width;
			_this.canvasHeight = height;

			var bounds = _this.getBounds(width, height, 100);
			window.resizeTo(bounds.width, bounds.height + 50 + (window.outerHeight - window.innerHeight));

			_this.scaleRatio = window.outerWidth / window.outerHeight;

			_this.sandboxWin.setMinimumSize(window.outerWidth, window.outerHeight);

			_this.scaleMode = 'fit';

		}, this);
	}

	/** Changes browser window to 'Full' mode, which puts the browser window into full-screen */
	toFull(){
		this.sandboxWin.setFullScreen(true);
		this.scaleMode = 'full';
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

	/** Handles resize events for the scale modes, currently 'Fit' is the only mode which actually requires any action
		in response to a window resize */
	onResize(){
		if (this.scaleMode == 'fit'){
			window.resizeTo((window.outerHeight * this.scaleRatio), window.outerHeight);
		}	
	}


}