import {GONE} from './constants.js'
import {CREATE_CARETAKER_MEDIA_TYPE, CREATE_STORE_ADD_MEDIA_TYPE, EXPORT_MEDIA_TYPE,
    IMPORT_MEDIA_TYPE, CAPURLSIST_MEDIA_TYPES} from './mediaTypes.js'

import makeUnusedStorageKey from './makeUnusedStorageKey.js'
import sendContent from './sendStorageValue.js'

function THROW(message){
    return () => {throw new Error(message)};
}

function addContent(storage, key, content, mediaType = 'application/octet-stream'){
    storage.set(key, {mediaType, content})
}

function makePUT(storage, getKey){
    return (req, res) => {
        if(req.method === 'GET'){
            sendContent(storage.get(getKey), res)
            return
        }
        if(req.method === 'PUT'){
            addContent(storage, getKey, req.body, req.get('Content-Type'))
    
            res.status(204).end()
        }

        return res.status(405).end()
    }
}

function makeDELETE(storage, getKey, keysToRevoke){
    return (req, res) => {
        if(req.method === 'GET'){
            sendContent(storage.get(getKey), res)
            return
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

        const getKey = makeUnusedStorageKey(storage);
        addContent(storage, getKey, req.body, req.get('Content-Type'))

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

    add.mediaType = CREATE_STORE_ADD_MEDIA_TYPE;

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
    return Object.assign((req, res) => {
        if(req.method !== 'POST'){
            return res.status(405).end()
        }

        const {target} = JSON.parse(req.body.toString());
        const {pathname} = new URL(target);
        const targetKey = pathname.slice(1); // strip first '/'

        if(!storage.has(targetKey)){
            return res.status(404).end()
        }
        else{
            const targeted = storage.get(targetKey);

            if(targeted.mediaType === CREATE_STORE_ADD_MEDIA_TYPE){
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
    }, 
    {mediaType: CREATE_CARETAKER_MEDIA_TYPE})
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

function makeExport(storage){
    return Object.assign((req, res) => {
        const exportData = Object.create(null);

        for(const [key, value] of storage){
            exportData[key] = {
                mediaType: value.mediaType, 
                content: value.mediaType === undefined || CAPURLSIST_MEDIA_TYPES.has(value.mediaType) ? 
                    JSON.stringify(value) : 
                    value.content.toString('base64')
            }
        }

        res.status(200).json(exportData)
    }, {mediaType: EXPORT_MEDIA_TYPE})
}

function import_(importData, storage){
    let createCaretakerKey, exportKey, importKey, addKey, deleteKey;

    for(const [key, value] of Object.entries(importData)){
        switch(value.mediaType){
            case CREATE_CARETAKER_MEDIA_TYPE:{
                createCaretakerKey = key;
                storage.set(createCaretakerKey, makeCaretaker(storage))
                break;
            }
            case CREATE_STORE_ADD_MEDIA_TYPE: {
                addKey = key;
                storage.set(addKey, makeAdd(storage))
                break;
            }
            case EXPORT_MEDIA_TYPE: {
                exportKey = key;
                storage.set(exportKey, makeExport(storage))
                break;
            }
            case IMPORT_MEDIA_TYPE: {
                importKey = key;
                storage.set(importKey, makeImport(storage))
                break;
            }
            case undefined:{
                break;
            }
            default: {
                const {mediaType, content} = value
                const buffer = Buffer.from(content, 'base64')
                storage.set(key, {mediaType, content: buffer})
            }
        }
    }

    return {createCaretakerKey, exportKey, importKey, addKey, deleteKey}
}

function makeImport(storage){
    return Object.assign((req, res) => {
        const importData = JSON.parse(req.body.toString())

        import_(importData, storage)

        res.status(204).end()
    }, {mediaType: IMPORT_MEDIA_TYPE})
}

export default function initializeServer(storage, origin, importData){
    let {createCaretakerKey, exportKey, importKey, addKey, deleteKey} = importData ? import_(importData, storage) : {}

    if(!createCaretakerKey){
        createCaretakerKey = makeUnusedStorageKey(storage);
        storage.set(createCaretakerKey, makeCaretaker(storage))
    }

    if(!exportKey){
        exportKey = makeUnusedStorageKey(storage);
        storage.set(exportKey, makeExport(storage))
    }

    if(!importKey){
        importKey = makeUnusedStorageKey(storage);
        storage.set(importKey, makeImport(storage))
    }

    if(!addKey /* || !deleteKey*/){
        ({addKey, deleteKey} = makeStore(storage))
    }

    const addURL = `${origin}/${addKey}`;

    return {
        'store': {
            'add': addURL,
            'DELETE': `${origin}/${deleteKey}`,
        },
        'createCaretaker': `${origin}/${createCaretakerKey}`,
        'export': `${origin}/${exportKey}`,
        'import': `${origin}/${importKey}`
    }
}