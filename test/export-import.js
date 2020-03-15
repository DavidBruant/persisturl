import got from 'got'
import test from 'ava'

import isURL from './helpers/isURL.js'
import startServer from './helpers/startServer.js'
import gotHTTPErrorHandler from './helpers/gotHTTPErrorHandler.js'



test('export and reimport', t => {
    t.plan(7)

    const content = {a:1, b:12, c:74};

    t.log('start a first server')
    return startServer()
    .then(({origin, serverProcess}) => {
        t.log(`first server origin ${origin}`)
        return got(`${origin}/first-use`).json()
        .then(({store: {add}, export: exportCap}) => {
            t.true(isURL(exportCap), '.export is a url')

            t.log('store some data in the first server')
            return got.post(add, {json: content, responseType: 'json'})
            .then(({body: {GET}}) => {
                const key = (new URL(GET)).pathname.slice(1)
                t.is(typeof key, 'string', `key is a string (${key})`)

                t.log('export first server data')
                return got.get(exportCap)
                .then(({statusCode, body}) => {
                    t.is(statusCode, 200)

                    return {exportData: body, key, serverProcess}
                })
            })
        })
    })
    .then(({exportData, key, serverProcess}) => {
        t.log('turn off first server')
        t.log('key', key)
        t.log('exportData', exportData)
        return (new Promise((resolve, reject) => {
            serverProcess.on('exit', resolve)
            serverProcess.kill()
        }))
        .then(() => ({exportData, key}))
    })
    .then(({exportData, key}) => {
        t.log('start new fresh server')
        return startServer()
        .then(({origin, serverProcess}) => {
            t.log(`second server origin ${origin}`)
            return got(`${origin}/first-use`).json()
            .then(({import: importCap}) => {
                t.true(isURL(importCap), '.import is a url')

                return got.post(importCap, {body: exportData, headers: {'Content-Type': 'application/json'}})
                .then(({statusCode}) => {
                    t.is(statusCode, 204, 'import returns a 204 on success')
                })
            })
            .then(() => {
                const url = `${origin}/${key}`;
                t.log(`trying ${url}`)
                return got.get(url, {responseType: 'json'})
                .then(({statusCode, body}) => {
                    t.is(statusCode, 200, `GETting the key of reimported content returns 200`)
                    t.deepEqual(body, content, `GETting the key of reimported content returns the correct content`)
                })
            })
            .then(() => {
                serverProcess.kill()
            })
        })
    })
    .catch(gotHTTPErrorHandler(t))
});

