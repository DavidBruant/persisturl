import express from 'express'
import parseCLIArgs from 'minimist'

function r(){ return Math.random().toString(36).slice(2) }

function makeRandomString(){
    return r() + r() + r()
}

const makeUnusedStorageKey = makeRandomString; // obviously wrong

function THROW(message){
    return () => {throw new Error(message)};
}

const argv = parseCLIArgs(process.argv)
const port = argv.port && Number(argv.port) || undefined

const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const storage = new Map();

function makeContentBundle(req, res){
    if(req.method !== 'POST'){
        return res.status(405).end()
    }

    const content = req.body;

    const getKey = makeUnusedStorageKey();
    storage.set(getKey, content)

    const putKey = makeUnusedStorageKey();
    storage.set(putKey, THROW('TODO PUT'))

    const deleteKey = makeUnusedStorageKey();
    storage.set(deleteKey, THROW('TODO DELETE'))

    const origin = `${req.protocol}://${req.get('Host')}`

    const getURL = `${origin}/${getKey}`;

    res.status(201)
        .set('Location', getURL)
        .json({
            'GET': getURL,
            'PUT': `${origin}/${putKey}`,
            'DELETE': `${origin}/${deleteKey}`,
        })
}


function makeStoreBundle(req, res){
    const storeKey = makeUnusedStorageKey();
    storage.set(storeKey, makeContentBundle)

    const createCaretakerForKey = makeUnusedStorageKey();
    storage.set(createCaretakerForKey, THROW('TODO caretaker'))

    const deleteKey = makeUnusedStorageKey();
    storage.set(deleteKey, THROW('TODO DELETE store'))

    const origin = `${req.protocol}://${req.get('Host')}`

    const storeURL = `${origin}/${storeKey}`;

    res.status(201)
        .set('Location', storeURL)
        .json({
            'store': storeURL,
            'create-caretaker-for': `${origin}/${createCaretakerForKey}`,
            'DELETE': `${origin}/${deleteKey}`,
        })
}


app.get('/first-use', (req, res) => {    
    if(storage.size === 0){
        makeStoreBundle(req, res)
    }
    else{
        res.status(410).end()
    }
})

app.all('*', (req, res) => {
    const key = req.path.slice(1); // strip initial '/'

    console.log('persisturl server receiving key', key)

    const stored = storage.get(key);

    if(!stored){
        res.status(404).end(`Nothing for key '${key}'`)
    }
    else{
        if(typeof stored === 'function'){
            try{
                return stored(req, res)
            }
            catch(e){
                res.status(500).send(e.message)
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

