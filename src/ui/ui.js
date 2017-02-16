var UI = {};

UI.MainMenu = {

	recent: {},
	
	init(){
		//$('#btn-new').click(this.openNew);

		document.getElementById('btn-new').addEventListener('click', function(){
			this.openNew();
		}.bind(this));

		document.getElementById('btn-getting-started').addEventListener('click', function(){
			shell.openExternal('https://github.com/GrinninColossus/TestMan/blob/master/README.md', {active: true});
		});

		document.getElementById('btn-github').addEventListener('click', function(){
			shell.openExternal('https://github.com/GrinninColossus/TestMan', {active: true});
		});

		this.getRecent();
	},

	getRecent(){

		console.log(localStorage);

		if (localStorage.recent){
			document.getElementById('no-recent').outerHTML = '';

			var recent = localStorage.recent;
			var list = document.getElementById('list-recent');

			for (var i = 0; i < recent.length; i++){
				var listElement = document.createElement('button');
					listElement.class = 'list-group-item';
					listElement.innerHtml = recent[i].title;

					list.appendChild(listElement);
			}

		}
	},

	openNew(){
		dialog.showOpenDialog(null, {title: 'Select app entry point' , buttonLabel: 'Set Publish Directory' }, function(path){
			if (path){

				//Build url for project and for sandbox page
				let projectURL = require('url').format({
				  protocol: 'file',
				  slashes: true,
				  pathname: path[0]
				});

				let sandboxURL = require('url').format({
				  protocol: 'file',
				  slashes: true,
				  pathname: require('path').join(__dirname, 'sandbox.html')
				});

				//Open new window and set up an event to send the project URL 
				const sandboxWin = new BrowserWindow({icon:'resources/icons/reload.png', frame: true, backgroundColor: '#2e2c29', webPreferences:{ webSecurity: false }});
				//sandboxWin.setMenu(null);
				sandboxWin.loadURL(sandboxURL);
				
				sandboxWin.webContents.on('did-finish-load', () => {
				    sandboxWin.webContents.send('get-data', {url: projectURL, path: path[0]});
				});

			}
		});
	}



}

UI.MainMenu.init();