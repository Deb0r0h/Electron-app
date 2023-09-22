const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');

//credo sia l'oggetto su cui vado ad gire...l'app + oggetti electron
//we are importing two Electron modules with CommonJS module syntax
const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron');

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

//funziona che crea la finestra (main)
function createMainWindow()
{
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev? 1000: 500,  //if is in dev width= 1000 else 500
        height: 600,
        //serve per il discorso di preload
        webPreferences:{
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname,'preload.js'),
        }
    });

    //open devtools if in dev
    if(isDev)
    {
        mainWindow.webContents.openDevTools();
    }

    //file che voglio caricare all'interno della mia main window
    mainWindow.loadFile(path.join(__dirname,'./renderer/index.html'));
}



//Create about window
var aboutWindow; // l'ho messo globale per non avere storie nel menuAbout
function createAboutWindow()
{
    aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300,
    });

    //ho aggiunto un menu solo per about
    const aboutM = Menu.buildFromTemplate(aboutMenu);
    aboutWindow.setMenu(aboutM);

    aboutWindow.loadFile(path.join(__dirname,'./renderer/about.html'));
}



//oggetto su cui chiamare la funzione per creare finestra
//App is ready
app.whenReady().then(() => {
    createMainWindow();


    //Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    //Remove mainWindow from memory on close
    mainWindow.on('closed',() => (mainWindow=null));



    //su mac restano le app restano aperte anche senza finestra, nel caso in cui non ci siano finestre
    //è necessario quindi aprirne una nuova; lo faccio dopo la Ready perchè posso
    //ascoltare gli eventi sono dopo l'inizializzazione dell'app
    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length===0){
            createMainWindow();
        }
    });
});


//Menu template
const menu = [
    {
        //vedi video 28:52 per aggiunta specifica per macOS

        /* label: 'File',
        submenu:[
            {
                label: 'Quit',
                click: () => app.quit(),
                accelerator: 'CmdOrCtrl+W'
            }
        ] */

        //si può riassumere con:
        role: 'fileMenu',
    },
    ...(!isMac 
        ? [
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About',
                        click: createAboutWindow,
                    },
                ],
            }    
          ]
        : [])
];



//menu fatto da me per evitare di richiamre all'infinito about
const aboutMenu = [
    {
        label: 'File',
        submenu:[
            {
                label: 'Quit window',
                click: () => {
                    if(aboutWindow){
                        aboutWindow.close();
                    }
                },
            },
        ],
    },
];


//Respond to ipcRenderer resize
ipcMain.on('image:resize',(e,options) =>{
    options.dest = path.join(os.homedir(),'imageresizer');
    resizeImage(options);
});

//Funzione che fa il resize
async function resizeImage({imgPath,width,height,dest})
{
    try
    {
        const newPath = await resizeImg(fs.readFileSync(imgPath),{
            width: +width,
            height: +height,
        });

        //create the filename
        const filename = path.basename(imgPath);

        //create destination folder if no exists
        if(!fs.existsSync(dest))
        {
            fs.mkdirSync(dest);
        }

        //write file to destination
        fs.writeFileSync(path.join(dest, filename),newPath);
        
        //send success to render
        mainWindow.webContents.send('image:done')

        //open dest folder
        shell.openPath(dest);

    }catch(error)
    {
        console.log(error);
    }
}

//chiude tutto e check se il pc è un mac
app.on('window-all-closed', () =>{
    if(process.platform !== 'darwin'){
    app.quit();
    }
})
