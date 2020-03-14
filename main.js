import express from 'express'
import parseCLIArgs from 'minimist'

function r(){ return Math.random().toString(36).slice(2) }

function makeRandomString(){
    return r() + r() + r()
}

function THROW(message){
    return () => {throw new Error(message)};
}

const argv = parseCLIArgs(process.argv)
const port = argv.port && Number(argv.port) || undefined

const app = express()

const storage = new Map();

const makeUnusedStorageKey = makeRandomString; // obviously wrong

function makeStore(req, res){
    const storeKey = makeUnusedStorageKey();
    storage.set(storeKey, THROW('TODO store'))

    const createCaretakerForKey = makeUnusedStorageKey();
    storage.set(createCaretakerForKey, THROW('TODO caretaker'))

    const deleteKey = makeUnusedStorageKey();
    storage.set(deleteKey, THROW('TODO DELETE store'))

    const urlPrefix = `${req.protocol}://${req.get('Host')}/`

    const storeURL = `${urlPrefix}/${storeKey}`;

    res.status(201)
        .set('Location', storeURL)
        .json({
            'store': storeURL,
            'create-caretaker-for': `${urlPrefix}/${createCaretakerForKey}`,
            'DELETE': `${urlPrefix}/${deleteKey}`,
        })
}


app.get('/first-use', (req, res) => {    
    if(storage.size === 0){
        makeStore(req, res)
    }
    else{
        res.status(410).end()
    }
})

app.all('*', (req, res) => {
    const key = req.path.slice(1); // strip initial '/'

    const stored = storage.get(key);

    if(!stored){
        res.status(404).end()
    }
    else{
        if(typeof stored === 'function'){
            try{
                return stored(req, res)
            }
            catch(e){
                res.status(500).send(e)
            }
        }
        else{
            res.send(stored)
        }
    }
})


const server = app.listen(port, () => {
    const {port} = server.address()
    console.log(`App listening on port ${port}!`)

    if(process.send){
        process.send({origin: `http://localhost:${port}`})
    }
})

