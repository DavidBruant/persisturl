import got from 'got'
import test from 'ava'

import isURL from './helpers/isURL.js'
import startServer from './helpers/startServer.js'
import gotHTTPErrorHandler from './helpers/gotHTTPErrorHandler.js'

test.before(t => {
    return startServer()
    .then(({origin, serverProcess}) => {
        return got(`${origin}/first-use`).json()
        .then(firstUseBundle => {
            return {
                firstUseBundle,
                serverProcess
            }
        })
    })
    .then(({firstUseBundle, serverProcess}) => {
        t.log('firstUseBundle', firstUseBundle)
        t.context = {firstUseBundle, serverProcess}
    })
    .catch(err => {
        console.log('before err', err)
        throw err;
    })
})

test.after.always(t => {
    return t.context.serverProcess.kill()
})


test('POST on createCaretaker on store creates a secundary store', t => {
    const {store, createCaretaker} = t.context.firstUseBundle

    return got.post(createCaretaker, {json: {target: store}, responseType: 'json'})
    .then(({statusCode, headers, body}) => {
        t.is(statusCode, 201)
        t.is(headers['content-type'], 'application/json; charset=utf-8')
        t.true(isURL(body.store), '.store')
        t.not(body.store, store, 'the new and previous store are different')
        t.is(headers['location'], body.store, 'Location header is .store url')
        t.true(isURL(body.revoke), `.revoke is a url`)

        return body.store
    })
    .then(newStore => {
        const content = {a:18};

        return got.post(newStore, {json: content, responseType: 'json'})
        .then(({statusCode, headers, body}) => {
            t.is(statusCode, 201)
            t.true(isURL(body.GET), '.GET is a url')
            t.true(isURL(body.PUT), `.PUT is a url`)
            t.true(isURL(body.DELETE), `.DELETE is a url`)

            return got.get(body.GET).json()
            .then(retrievedContent => {
                t.deepEqual(content, retrievedContent)
            })
        })
    })
    .catch(gotHTTPErrorHandler(t));
})

test('POST on revoke prevents further creations with new store', t => {
    const {store, createCaretaker} = t.context.firstUseBundle

    return got.post(createCaretaker, {json: {target: store}, responseType: 'json'})
    .then(({body: {store: newStore, revoke}}) => {
        return got.post(revoke)
        .then(({statusCode}) => {
            t.is(statusCode, 204)

            return got.post(newStore, {json: {yo: 87}})
            .catch(({response: {statusCode}}) => {
                t.is(statusCode, 410)
            })
        })
    })    
    .catch(gotHTTPErrorHandler(t));
})
