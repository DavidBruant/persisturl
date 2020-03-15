import {GONE} from './constants.js'

import makeUnusedStorageKey from './makeUnusedStorageKey.js'


function THROW(message){
    return () => {throw new Error(message)};
}

function makePUT(storage, getKey){
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

function makeDELETE(storage, getKey, keysToRevoke){
    return (req, res) => {
        if(req.method === 'GET'){
            return res.status(200).send(storage.get(getKey))
        }
        if(req.method === 'DELETE'){
            for(const key of keysToRevoke){
                storage.set(key, GONE)
            }
    
    
            res.status(204).end()
        }

        return res.status(405).end()
    }
}

function makeAdd(storage){
    const add = (req, res) => {
        if(req.method !== 'POST'){
            return res.status(405).end()
        }

        const content = req.body;

        const getKey = makeUnusedStorageKey(storage);
        storage.set(getKey, content)

        const putKey = makeUnusedStorageKey(storage);
        storage.set(putKey, makePUT(storage, getKey))

        const deleteKey = makeUnusedStorageKey(storage);
        storage.set(deleteKey, makeDELETE(storage, getKey, [getKey, putKey, deleteKey]))

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

function makeRevoke(storage, keysToRevoke){
    return (req, res) => {
        for(const key of keysToRevoke){
            storage.set(key, GONE)
        }

        res.status(204).end()
    }
}

function makeCaretaker(storage){
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
                const {addKey, deleteKey} = makeStore(storage)

                const revokeKey = makeUnusedStorageKey(storage);
                storage.set(revokeKey, makeRevoke(storage, [addKey, deleteKey, revokeKey]))

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

function makeStore(storage){
    const addKey = makeUnusedStorageKey(storage);
    storage.set(addKey, makeAdd(storage))

    const deleteKey = makeUnusedStorageKey(storage);
    storage.set(deleteKey, THROW('TODO DELETE store'))

    return {
        addKey,
        deleteKey 
    }
}

export default function makeStoreBundle(storage){
    return (req, res) => {
        const createCaretakerKey = makeUnusedStorageKey(storage);
        storage.set(createCaretakerKey, makeCaretaker(storage))

        const {addKey, deleteKey} = makeStore(storage)

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
}