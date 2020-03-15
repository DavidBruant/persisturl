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
app.use(express.text())
app.use(express.raw()) 

const GONE = Object.freeze({});

const storage = new Map();

function makePUT(getKey){
    return (req, res) => {
        if(req.method === 'GET'){
            return res.status(200).send(storage.get(getKey))
        }
        if(req.method === 'PUT'){
            const content = req.body;
            storage.set(getKey, content)
    
            res.status(204).end()
        }

        return res.status(405).end()
    }
}

function makeDELETE(getKey, putKey, deleteKey){
    return (req, res) => {
        if(req.method === 'GET'){
            return res.status(200).send(storage.get(getKey))
        }
        if(req.method === 'DELETE'){
            storage.set(getKey, GONE)
            storage.set(putKey, GONE)
            storage.set(deleteKey, GONE)
    
            res.status(204).end()
        }

        return res.status(405).end()
    }
}

function makeAdd(){
    const add = (req, res) => {
        if(req.method !== 'POST'){
            return res.status(405).end()
        }

        const content = req.body;

        const getKey = makeUnusedStorageKey();
        storage.set(getKey, content)

        const putKey = makeUnusedStorageKey();
        storage.set(putKey, makePUT(getKey))

        const deleteKey = makeUnusedStorageKey();
        storage.set(deleteKey, makeDELETE(getKey, putKey, deleteKey))

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

    add.type = 'add'

    return add;
}

function makeRevoke(keysToRevoke){
    return (req, res) => {
        for(const key of keysToRevoke){
            storage.set(key, GONE)
        }

        res.status(204).end()
    }
}

function makeStore(){
    const addKey = makeUnusedStorageKey();
    storage.set(addKey, makeAdd())

    const deleteKey = makeUnusedStorageKey();
    storage.set(deleteKey, THROW('TODO DELETE store'))

    return {
        addKey,
        deleteKey 
    }
}


function makeCaretaker(){
    return (req, res) => {
        if(req.method !== 'POST'){
            return res.status(405).end()
        }

        const {target} = req.body;
        const {pathname} = new URL(target);
        const targetKey = pathname.slice(1); // strip first '/'

        if(!storage.has(targetKey)){
            return res.status(404).end()
        }
        else{
            const targeted = storage.get(targetKey);

            if(targeted.type === 'add'){
                const {addKey, deleteKey} = makeStore()

                const revokeKey = makeUnusedStorageKey();
                storage.set(revokeKey, makeRevoke([addKey, deleteKey, revokeKey]))

                const origin = `${req.protocol}://${req.get('Host')}`
                const addURL = `${origin}/${addKey}`;

                res.status(201)
                    .set('Location', addURL)
                    .json({
                        'store': {
                            'add': addURL,
                            'DELETE': `${origin}/${deleteKey}`,
                        },
                        'revoke': `${origin}/${revokeKey}`
                    })
            }
            else{
                return res.status(400).send(`Impossible to use caretaker on a target type other than 'store'`)
            }        
        }
    }
}

function makeStoreBundle(req, res){
    const createCaretakerKey = makeUnusedStorageKey();
    storage.set(createCaretakerKey, makeCaretaker())

    const {addKey, deleteKey} = makeStore()

    const origin = `${req.protocol}://${req.get('Host')}`

    const addURL = `${origin}/${addKey}`;

    res.status(201)
        .set('Location', addURL)
        .json({
            'store': {
                'add': addURL,
                'DELETE': `${origin}/${deleteKey}`,
            },
            'createCaretaker': `${origin}/${createCaretakerKey}`
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

    if(!storage.has(key)){
        res.status(404).end(`Nothing for key '${key}'`)
    }
    else{
        const stored = storage.get(key);

        if(stored === GONE){
            return res.status(410).end()
        }

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

