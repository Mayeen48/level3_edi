// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem } = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

function createWindow() {

    // Create the browser window.
    mainWindow = new BrowserWindow({
            width: 1200,
            height: 600,
            icon: __dirname + '/images/icons/icon.ico',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true
            }
        })
        // mainWindow.webContents.openDevTools()
        // mainWindow.setMenu(null)
        // mainWindow.setMenuBarVisibility(false)
        // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
    setMainMenu();
}

function setMainMenu() {
    // const template = [];
    const template = [{
            label: 'File',
            submenu: [{
                role: 'quit'
            }, ]
        },
        {
            label: 'Edit',
            submenu: [{
                    role: 'undo'
                },
                {
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'cut'
                },
                {
                    role: 'copy'
                },
                {
                    role: 'paste'
                }
            ]
        },

        {
            label: 'View',
            submenu: [{
                    role: 'reload'
                },
                {
                    role: 'toggledevtools'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'resetzoom'
                },
                {
                    role: 'zoomin'
                },
                {
                    role: 'zoomout'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'togglefullscreen'
                }
            ]
        },

        {
            role: 'window',
            submenu: [{
                    role: 'minimize'
                },
                {
                    role: 'close'
                }
            ]
        },

        {
            role: 'help',
            submenu: [{
                label: 'Learn More'
            }]
        }, {
            label: 'Custom',
            click() {
                //     // app.quit()
                //     // alert("Clicked");
                console.log("Clicked");
            }
        }
    ]

    // const menu = Menu.buildFromTemplate(template)
    // Menu.setApplicationMenu(menu)
}

// multiple instance of app controll
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    // Create myWindow, load the rest of the app, etc...
    app.on('ready', () => {})
}

// multiple end 

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
    // mainWindow = null
})

app.on('activate', function() {

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }


})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.