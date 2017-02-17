var UI = {};

UI.MainMenu = {

	/** Init main menu events */
	init(){

		document.getElementById('btn-new').addEventListener('click', function(){
			this.openNew();
		}.bind(this));

		document.getElementById('btn-getting-started').addEventListener('click', function(){
			shell.openExternal('https://github.com/GrinninColossus/TestMan/blob/master/README.md', {active: true});
			toastr.success("Opened in browser");
		});

		document.getElementById('btn-github').addEventListener('click', function(){
			shell.openExternal('https://github.com/GrinninColossus/TestMan', {active: true});
			toastr.success("Opened in browser");
		});

		document.getElementById('testman-header').addEventListener('click', function(){ this.toggleMenu() }.bind(this));

	},

	/** Points the program to a new app entry point and reloads the webview */
	openNew(){

		var _this = this;
		dialog.showOpenDialog(null, {title: 'Select app entry point' , buttonLabel: 'Set Publish Directory' }, function(path){
			if (path){
				_this.toggleMenu();
				_this.enableToolbar();

				//Build url for project and for sandbox page
				let projectURL = require('url').format({
				  protocol: 'file',
				  slashes: true,
				  pathname: path[0]
				});

				var webview = document.getElementById('sandbox-webview');
					webview.loadURL(projectURL);
					webview.openDevTools();
					webview.addEventListener("dom-ready", function(){
						sandboxManager.toFit();
					});

				sandboxManager.initLocalHost(path[0], 8000);
	    	
			}
		});

	},

	toggleMenu(){
		var menu = document.getElementById('menu');

		if (menu.style.display == 'none'){ 
			menu.style.display = 'inline';
		} else {
			menu.style.display = 'none';
		}	
	},

	/** Enables all disabled buttons */
	enableToolbar(){
		var btns = document.getElementsByTagName('button');
		for (var i = 0; i < btns.length; i++){
			btns[i].disabled = false;
		}
	}

}

UI.MainMenu.init();