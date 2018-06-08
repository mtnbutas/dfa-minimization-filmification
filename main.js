const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;
const {dialog} = require('electron');

let mainWindow;
let newFilmWindow;
let editFilmWindow;
let customDialog;
let mainMenu;
let loaded_file = "";
let selectedProcess = "";
let new_film = false;

var unsaved_changes = false;
var og_set_of_states = [];
var og_alphabet = [];
var og_start_state = "";
var og_final_states = [];
var og_transitions = [];

var new_set_of_states = [];
var new_alphabet = [];
var new_start_state = "";
var new_final_states = [];
var new_transitions = [];

// Listen for the app to be ready
app.on('ready', function() {
	let screenSize = electron.screen.getPrimaryDisplay().size;

	// Create new window
	mainWindow = new BrowserWindow({
		width: screenSize.width,
		height: screenSize.height,
		minWidth: 1100,
		minHeight: 850,
		icon: path.join(__dirname, 'assets/icons/png/icon.png')
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	});

	// Load html into window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	})); //file://dirname/index.html

	mainWindow.on('close', function(e) { //   <---- Catch close event
       	if(unsaved_changes){
       		e.preventDefault();
       		selectedProcess = "quit";
	       	show_unsaved_changes_dialog();
       	}   
    });


	// Build menu from template
	mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	mainMenu.items[0].submenu.items[3].enabled = false;
	
	// Insert menu
	Menu.setApplicationMenu(mainMenu);
});


// Handle Create new film window
function createNewFilmWindow(){
	// Create new window
	newFilmWindow = new BrowserWindow({
		parent: mainWindow,
		modal: true,
		show: false
	});

	// Load html into window
	newFilmWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'assets/html/createNewFilmWindow.html'),
		protocol: 'file:',
		slashes: true
	})); //file://dirname/createNewFilmWindow.html

	newFilmWindow.setResizable(false);

	newFilmWindow.once('ready-to-show', () => {
		newFilmWindow.show();
		Menu.setApplicationMenu(null);
	});

	// Garbage collection handle
	newFilmWindow.on('close', function(e){
		newFilmWindow.hide();
		e.preventDefault();
		Menu.setApplicationMenu(mainMenu);
	});
}

// Catch New Film Specifications
ipcMain.on('film:specifications', function(e, new_film_specs){
	// Load html into window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'cyber-film.html'),
		protocol: 'file:',
		slashes: true
	})); //file://dirname/cyber-film.html

	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents.send('film:specifications', new_film_specs);
		new_set_of_states = new_film_specs[0];
		new_alphabet = new_film_specs[1];
		new_start_state = new_film_specs[2];
		new_final_states = new_film_specs[3];
		new_transitions = new_film_specs[4];
		if(new_film){
			loaded_file = "";
			unsaved_changes = true;
			// mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
			if(Menu.getApplicationMenu() == null){
				mainMenu.items[0].submenu.items[3].enabled = true;
			}
			else{
				Menu.getApplicationMenu().items[0].submenu.items[3].enabled = true;
			}
			
		}
		
		newFilmWindow.close();
	});
	
});

// Handle edit film window
function showEditFilmWindow(){
	// Create edit film window
	editFilmWindow = new BrowserWindow({
		parent: mainWindow,
		modal: true,
		show: false
	});

	// Load html into window
	editFilmWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'assets/html/editFilmWindow.html'),
		protocol: 'file:',
		slashes: true
	})); //file://dirname/assets/html/editFilmWindow.html

	editFilmWindow.setResizable(false);

	editFilmWindow.once('ready-to-show', () => {
		editFilmWindow.show();
		Menu.setApplicationMenu(null);
	});

	// Garbage collection handle
	editFilmWindow.on('close', function(e){
		editFilmWindow.hide();
		Menu.setApplicationMenu(mainMenu);
	});
}

// Show Specifications and open Edit Film Window
ipcMain.on('film:show-specifications', function(e, film_specs){
	
	showEditFilmWindow();

	editFilmWindow.webContents.on('did-finish-load', () => {
		editFilmWindow.webContents.send('film:show-specifications', film_specs);
	});
	
});

// Updated but NOT SAVED Specifications from the Edit Film Window
ipcMain.on('film:update-only-specifications', function(e, update_only_film_specs){
	if(new_film || !(equal_arr(og_set_of_states, update_only_film_specs[0]) && equal_arr(og_alphabet, update_only_film_specs[1]) && og_start_state == update_only_film_specs[2] && equal_arr(og_final_states, update_only_film_specs[3]) && equal_arr(og_transitions, update_only_film_specs[4]))){
		unsaved_changes = true;
		if(Menu.getApplicationMenu() == null){
			mainMenu.items[0].submenu.items[3].enabled = true;
		}
		else{
			Menu.getApplicationMenu().items[0].submenu.items[3].enabled = true;
		}
		
		new_set_of_states = update_only_film_specs[0];
		new_alphabet = update_only_film_specs[1];
		new_start_state = update_only_film_specs[2];
		new_final_states = update_only_film_specs[3];
		new_transitions = update_only_film_specs[4];
	}
	else{
		unsaved_changes = false;	
		if(Menu.getApplicationMenu() == null){
			mainMenu.items[0].submenu.items[3].enabled = false;
		}
		else{
			Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
		}
	}
	
	mainWindow.webContents.send('film:specifications', update_only_film_specs);
	editFilmWindow.close();
});


function equal_arr( _arr1, _arr2 ) {
  if (!Array.isArray(_arr1) || ! Array.isArray(_arr2) || _arr1.length !== _arr2.length)
      return false;

    var arr1 = _arr1.concat().sort();
    var arr2 = _arr2.concat().sort();

    for (var i = 0; i < arr1.length; i++) {
    	if(Array.isArray(arr1[i]) && Array.isArray(arr2[i])){
    		if(!(equal_arr(arr1[i], arr2[i]))){
    			return false;
    		}
    	}
        else if (arr1[i] !== arr2[i])
            return false;

    }

    return true;
}

function show_unsaved_changes_dialog(){
	// Create new window
	customDialog = new BrowserWindow({
		parent: mainWindow,
		modal: true,
		show: false,
		height: 130,
		width: 500
	});

	// Load html into window
	customDialog.loadURL(url.format({
		pathname: path.join(__dirname, 'assets/html/unsavedChanges.html'),
		protocol: 'file:',
		slashes: true
	})); //file://dirname/unsavedChanges.html

	customDialog.setResizable(false);

	customDialog.once('ready-to-show', () => {
		customDialog.show();
		Menu.setApplicationMenu(null);
			
	});

	// Garbage collection handle
	customDialog.on('close', function(e){
		customDialog.hide();
		e.preventDefault();
		Menu.setApplicationMenu(mainMenu);
		
	});
}


function load_flm_dialog(prev_unsaved_changes_val){	
	let open_file;
	if(unsaved_changes){
		show_unsaved_changes_dialog();
	}
	else{
		open_file = dialog.showOpenDialog(
			mainWindow,
			{
				properties: ['openFile'],
				filters: [
			      {name: 'Cyber-film (*.flm)', extensions: ['flm']}
			    ]
			}
		);
		if(open_file !== undefined){
			fs.readFile(open_file.toString(), 'utf-8', function(error, data){
				if(error){
					dialog.showErrorBox('Incorrect File Type', 'Please select a file of type Cyber-film (.flm)');
					load_flm_dialog(prev_unsaved_changes_val);
				}
				else{
					new_film = false;
					loaded_file = open_file;
					unsaved_changes = false;
					if(Menu.getApplicationMenu() == null){
						mainMenu.items[0].submenu.items[3].enabled = false;
					}
					else{
						Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
					}

					mainWindow.loadURL(url.format({
						pathname: path.join(__dirname, 'cyber-film.html'),
						protocol: 'file:',
						slashes: true
					})); //file://dirname/cyber-film.html

					mainWindow.webContents.on('did-finish-load', () => {
						mainWindow.webContents.send('film:specifications', string_to_arr(data));
						mainWindow.setTitle(open_file.toString());
					});

					return;
				}
			});
		}
		else{
			unsaved_changes = prev_unsaved_changes_val;
		}
	}
	
};

ipcMain.on('unsaved-changes-dialog', function(e, choice){
	customDialog.close();
	if(choice === 'continue'){
		if(selectedProcess == 'load'){
			selectedProcess = "";
			if(unsaved_changes){
				unsaved_changes = false;
				load_flm_dialog(true);
			}
			else{
				unsaved_changes = false;
				load_flm_dialog(false);
			}
			
		}
		else if(selectedProcess == 'quit'){
			mainWindow.destroy();
		}
		else if(selectedProcess == 'sample'){
			selectedProcess = "";
			open_sample_film();
		}
		else if(selectedProcess == 'new'){
			selectedProcess = "";
			new_film = true;
			createNewFilmWindow();
		}
	}
	else if(choice === 'save'){
		if(new_film && loaded_file == ""){
			create_new_file();
		}
		else{
			new_film = false;
			write_changes_to_file();
			if(selectedProcess == 'load'){
				selectedProcess = "";
				unsaved_changes = false;
				load_flm_dialog(false);
			}
			else if(selectedProcess == 'quit'){
				mainWindow.destroy();
			}
			else if(selectedProcess == 'sample'){
				selectedProcess = "";
				open_sample_film();
			}
			else if(selectedProcess == 'new'){
				selectedProcess = "";
				new_film = true;
				createNewFilmWindow();
			}
		}	

	}
	else{
		selectedProcess = "";
	}

});

function create_new_file(){
	og_set_of_states = new_set_of_states;
	og_alphabet = new_alphabet;
	og_start_state = new_start_state;
	og_final_states = new_final_states;
	og_transitions = new_transitions;

	let new_film_specs = arr_to_string(new_set_of_states) + "\n" + arr_to_string(new_alphabet) + "\n" + new_start_state.toString() + "\n" + arr_to_string(new_final_states) + "\n" + arr_to_string(new_transitions);

	dialog.showSaveDialog(
		mainWindow,
		{
			filters: [{ name: 'Cyber-film (*.flm)', extensions: ['flm']}],
		}, 
		function (fileName) {

	    if (fileName === undefined) return;

	    loaded_file = fileName;

	    fs.writeFile(fileName, new_film_specs, function (error) {   
	    	if(error){
				console.log("An error ocurred creating the file" + error.message);
				return;
			}
			else{
		    	dialog.showMessageBox(mainWindow, { title: "Successfully created", message: "The film has been saved", buttons: ["OK"] });

		    	new_film = false;
		    	unsaved_changes = false;

				if(Menu.getApplicationMenu() == null){
					mainMenu.items[0].submenu.items[3].enabled = false;
				}
				else{
					Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
				}
		   
		 		if(selectedProcess == 'load'){
					selectedProcess = "";
					load_flm_dialog(false);
				}
				else if(selectedProcess == 'quit'){
					mainWindow.destroy();
				}
				else if(selectedProcess == 'sample'){
					selectedProcess = "";
					open_sample_film();
				}
				else if(selectedProcess == 'new'){
					selectedProcess = "";
					new_film = true;
					createNewFilmWindow();
				}
			}

   		 });

  	}); 
}

function write_changes_to_file(){
	//UPDATE/SAVE CHANGES
	let new_film_specs = arr_to_string(new_set_of_states) + "\n" + arr_to_string(new_alphabet) + "\n" + new_start_state + "\n" + arr_to_string(new_final_states) + "\n" + arr_to_string(new_transitions);
	fs.writeFile(loaded_file.toString(), new_film_specs, (error) => {
		if(error){
			console.log("An error ocurred updating the file" + error.message);
			return;
		}
		else{
			dialog.showMessageBox(mainWindow, { title: "Successfully updated", message: "The film has been updated", buttons: ["OK"] });
			unsaved_changes = false;
			
			if(Menu.getApplicationMenu() == null){
				mainMenu.items[0].submenu.items[3].enabled = false;
			}
			else{
				Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
			}
		}
	});
}

function open_sample_film(){
	loaded_file = "";
	new_film = false;
	unsaved_changes = false;
	
	if(Menu.getApplicationMenu() == null){
		mainMenu.items[0].submenu.items[3].enabled = false;
	}
	else{
		Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
	}
	
	// Load html into window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'cyber-film.html'),
		protocol: 'file:',
		slashes: true
	})); //file://dirname/cyber-film.html

	// Send sample film data
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.setTitle('Cyber-Filmification VLE: DFA minimization sample film');
		mainWindow.webContents.send('film:specifications', [
			["A", "B", "C", "D", "E", "F"],
			["0", "1"],
			"A",
			["C", "D", "E"],
			[	["A", 0, "B"],
				["A", 1, "C"],
				["B", 0, "A"],
				["B", 1, "D"],
				["C", 0, "E"],
				["C", 1, "F"],
				["D", 0, "E"],
				["D", 1, "F"],
				["E", 0, "E"],
				["E", 1, "F"],
				["F", 0, "F"],
				["F", 1, "F"]
			],
			"uneditable"
		]);
	});
}

// helper function to turn the read string from flm file to array
// FOR EDITING FILM
function string_to_arr(data){
	var arr = data.split(/[\r\n]+/);
	var film_specs = [];

	film_specs.push(JSON.parse(arr[0]));
	film_specs.push(JSON.parse(arr[1]));
	film_specs.push(arr[2]);
	film_specs.push(JSON.parse(arr[3]));
	film_specs.push(JSON.parse(arr[4]));

	og_set_of_states = film_specs[0];
	og_alphabet = film_specs[1];
	og_start_state = film_specs[2];
	og_final_states = film_specs[3];
	og_transitions = film_specs[4];

	return film_specs;
}

// helper function to turn updated film specs from array to string
// FOR UPDATING FILM SPECS
function arr_to_string(arr){
	let str = "[";
	for(let i = 0; i < arr.length; i++){
		if(Array.isArray(arr[i])){
			str += arr_to_string(arr[i]);
		}
		else{
			str = str + "\"" + arr[i] + "\"";
		}
		
		if(i == arr.length-1){
			str += "]";
		}
		else{
			str += ",";
		}
	}

	return str;
}

// Create menu template
const mainMenuTemplate = [
	{
		label: 'File',
		submenu:[
			{
				label: 'New Film',
				click(){
					if(unsaved_changes){
						selectedProcess = "new";
						show_unsaved_changes_dialog();
					}
					else{
						unsaved_changes = false;
						
						if(Menu.getApplicationMenu() == null){
							mainMenu.items[0].submenu.items[3].enabled = false;
						}
						else{
							Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
						}

						new_film = true;
						
						createNewFilmWindow();
					}
					
				}
			},
			{
				label: 'Load Film',
				click(){
					selectedProcess = 'load';
					load_flm_dialog(unsaved_changes);
				}
			},
			{
				label: 'Open Sample Film',
				click(){
					if(unsaved_changes){
						selectedProcess = "sample";
						show_unsaved_changes_dialog();
					}
					else{
						unsaved_changes = false;
						
						if(Menu.getApplicationMenu() == null){
							mainMenu.items[0].submenu.items[3].enabled = false;
						}
						else{
							Menu.getApplicationMenu().items[0].submenu.items[3].enabled = false;
						}

						open_sample_film();
					}
				}
			},
			{
				label: 'Save',
				id: 'menu-save',
				accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
				click(){
					if(new_film){
						create_new_file();
					}
					else{
						write_changes_to_file();
					}
				}
				
			},
			{
				label: 'Quit',
				accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
				click(){
					selectedProcess = 'quit';
					app.quit();
				}
			}
		]
	}
];

// if mac, add empty object to menu
if(process.platform == 'darwin'){
	mainMenuTemplate.unshift({});
}

// add developer tools item if not in prod
// if(process.env.NODE_ENV !== 'production'){
// 	mainMenuTemplate.push({
// 		label: 'Developer Tools',
// 		submenu:[
// 			{
// 				label: 'Toggle DevTools',
// 				click(item, focusedWindow){
// 					focusedWindow.toggleDevTools();
// 				}
// 			}
// 		]
// 	});
// }