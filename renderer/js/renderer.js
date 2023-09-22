//variabili collegate ai miei elementi nel form html
const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');



/*
e ==== è l'oggetto evento passato come argomento a una funzione di gestione di un evento, come una funzione di gestione per un evento di input di tipo file.
e.target === si riferisce all'elemento HTML che ha scatenato l'evento, quindi in questo caso, si tratta dell'elemento di input di tipo file che è stato selezionato dall'utente.
e.target.files === è un oggetto che rappresenta la lista dei file selezionati tramite l'input di tipo file. Questo è un oggetto di tipo FileList.
*/
function loadImage(e){
    const file = e.target.files[0];

    if(!isFileImage(file))
    {
        alertError('Please select an image file');
        return;
    }

    //Get original dimensions
    const image = new Image();
    image.src = URL.createObjectURL(file);
    //quando il caricamento è completato l'evento load avviene, function è 
    //una funzione di callback in risposta che prende le dimensioni
    image.onload = function(){
        widthInput.value = this.width;
        heightInput.value = this.height
    }

    form.style.display = 'block';  //prima era hidden
    filename.innerText = file.name;
    outputPath.innerText = path.join(os.homedir(),'imageresizer');
}

//Send image data to main
function sendImage(e){
    e.preventDefault();

    const width = widthInput.value;
    const height = heightInput.value;
    const imgPath = img.files[0].path;


    if(!img.files[0])
    {
        alertError('Please upload an image');
        return;
    }

    if(width === '' || height === '')
    {
        alertError('Please fill in a width and height');
        return;
    }

    //Send to main using ipcRenderer
    ipcRenderer.send('image:resize', {
        imgPath,
        width,
        height,
    });

}

//Catch the image:done event
ipcRenderer.on('image:done', () =>
    alertSucces(`Image resized to ${heightInput.value} x ${widthInput.value}`)
    );



//make sure file is image
function isFileImage(file)
{
    const acceptedImageTypes = ['image/gif','image/png','image/jpeg','image/jpg'];
    return file && acceptedImageTypes.includes(file['type']);  //è vero solo se file è uno dei 4 tipi nell'array
}


//funzione di avviso errore
function alertError(message)
{
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center',
        }
    });
}

//funzione di avvisso successo
function alertSucces(message)
{
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'green',
            color: 'white',
            textAlign: 'center',
        }
    });
}





/*
Il metodo addEventListener è un metodo utilizzato per ascoltare gli eventi in JavaScript 
e associare una funzione a un elemento HTML in modo da poter rispondere a un'azione o a un evento specifico. 
Questo è utilizzato nel DOM per rendere le pagine web interattive.
*/
img.addEventListener('change',loadImage);

form.addEventListener('submit',sendImage);