import got from 'got'
import test from 'ava'

import isURL from './helpers/isURL.js'
import startServer from './helpers/startServer.js'
import gotHTTPErrorHandler from './helpers/gotHTTPErrorHandler.js'

async function createServerAfterFirstUse(importData){
    const {origin, serverProcess} = await startServer()
    const {
        store: {add}, export: exportCap, import: importCap, createCaretaker
    } = await got.post(`${origin}/first-use`, {body: importData, headers: {'Content-Type': 'application/json'}}).json()

    return {
        origin, serverProcess,
        store: {add}, export: exportCap, import: importCap, createCaretaker
    }
}

function getKeyFromURL(url){
    return (new URL(url)).pathname.slice(1); // strip beginning '/'
}


test('basic export and reimport', async t => {
    t.plan(7)

    const content = {a:1, b:12, c:74};

    try{
        t.log('start a first server')
        const {
            origin: firstOrigin, serverProcess: firstServerProcess,
            store: {add}, export: exportCap
        } = await createServerAfterFirstUse()
        t.log(`first server origin ${firstOrigin}`)
    
        t.true(isURL(exportCap), '.export is a url')

        t.log('store some data in the first server')
        const {body: {GET}} = await got.post(add, {json: content, responseType: 'json'})
        
        const key = (new URL(GET)).pathname.slice(1)
        t.is(typeof key, 'string', `key is a string (${key})`)

        t.log('export first server data')
        const {statusCode: exportStatusCode, body: exportData} = await got.get(exportCap)
                    
        t.is(exportStatusCode, 200);

        t.log('turning off first server')
        t.log('key', key)
        t.log('exportData', exportData)
        await new Promise((resolve, reject) => {
            firstServerProcess.on('exit', resolve)
            firstServerProcess.kill()
        });

        t.log('start new fresh server')
        const {
            origin: secondOrigin, serverProcess: secondServerProcess,
            import: importCap
        } = await createServerAfterFirstUse()
        t.log(`second server origin ${secondOrigin}`)
        
        t.true(isURL(importCap), '.import is a url')

        t.log('import via the import capability')
        const {statusCode: importStatusCode} = await got.post(
            importCap, 
            {body: exportData, headers: {'Content-Type': 'application/json'}}
        )
        
        t.is(importStatusCode, 204, 'import returns a 204 on success')
        
        const url = `${secondOrigin}/${key}`;
        
        t.log(`trying ${url}`)
        const {statusCode: afterImportStatusCode, body} = await got.get(url, {responseType: 'json'})
                    
        t.is(afterImportStatusCode, 200, `GETting the key of reimported content returns 200`)
        t.deepEqual(body, content, `GETting the key of reimported content returns the correct content`)
        
        secondServerProcess.kill()
    }
    catch(e){
        gotHTTPErrorHandler(t)(e)
    }
});

test('all reimport cases', async t => {
    const content = {e:15, grrrr: 'rrr'};

    const keysToRetrieve = {
        store: {
            add: undefined
        },
        createCaretaker: undefined,
        import: undefined,
        export: undefined
    }

    try{
        t.log('start a first server')
        const {
            serverProcess: firstServerProcess,
            store: {add}, createCaretaker, export: exportCap, import: importCap
        } = await createServerAfterFirstUse()

        keysToRetrieve.store.add = getKeyFromURL(add)
        keysToRetrieve.createCaretaker = getKeyFromURL(createCaretaker)
        keysToRetrieve.export = getKeyFromURL(exportCap)
        keysToRetrieve.import = getKeyFromURL(importCap)
        
        t.log('export')
        const {body: exportData} = await got.get(exportCap)

        t.log('shut down first server')
        await new Promise((resolve, reject) => {
            firstServerProcess.on('exit', resolve)
            firstServerProcess.kill()
        });

        t.log('start a second server and use /first-use to import data')
        t.log('import data', exportData)
        const {
            origin: secondOrigin, serverProcess: secondServerProcess,
            store: {add: secondAdd}, createCaretaker: secondCreateCreataker, 
            import: secondImportCap, export: secondExportCap
        } = await createServerAfterFirstUse(exportData)

        t.is(keysToRetrieve.createCaretaker, getKeyFromURL(secondCreateCreataker), 'same createCaretaker key')
        t.is(keysToRetrieve.store.add, getKeyFromURL(secondAdd), 'same add key')
        t.is(keysToRetrieve.export, getKeyFromURL(secondExportCap), 'same export key')
        t.is(keysToRetrieve.import, getKeyFromURL(secondImportCap), 'same import key')
        
        secondServerProcess.kill()
    }
    catch(e){
        gotHTTPErrorHandler(t)(e)
    }
})


/*
    Un test un peu plus complet en terme de contenu:

    - commencer un serveur
        - retenir
            - store
            - createCaretaker
    - mettre un contenu
        - retenir
            - GET, PUT, DELETE
    - créer un caretaker
        - retenir
            - la nouvelle cap
            - la fonction de révocation

*/