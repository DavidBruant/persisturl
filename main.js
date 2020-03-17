import express from 'express'
import parseCLIArgs from 'minimist'

import initializeServer from './library/initializeServer.js'
import sendContent from './library/sendStorageValue.js'
import {GONE} from './library/constants.js'

const argv = parseCLIArgs(process.argv)
const port = argv.port && Number(argv.port) || undefined

const app = express()
app.use(express.raw({type: () => true})) // parse all bodies as Buffers 

const storage = new Map();

app.post('/first-use', (req, res) => {    
    if(storage.size === 0){
        const origin = `${req.protocol}://${req.get('Host')}`
        const importData = req.body.length >= 2 ? JSON.parse(req.body.toString()) : undefined;
        const initBundle = initializeServer(storage, origin, importData)

        res.status(201)
            .set('Location', initBundle.store.add)
            .json(initBundle)
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
            sendContent(stored, res)
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

