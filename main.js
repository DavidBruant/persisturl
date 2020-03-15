import express from 'express'
import parseCLIArgs from 'minimist'

import makeServerBundle from './library/makeServerBundle.js'
import {GONE} from './library/constants.js'

const argv = parseCLIArgs(process.argv)
const port = argv.port && Number(argv.port) || undefined

const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.text())
app.use(express.raw()) 

const storage = new Map();


app.post('/first-use', (req, res) => {    
    if(storage.size === 0){
        makeServerBundle(storage)(req, res)
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

