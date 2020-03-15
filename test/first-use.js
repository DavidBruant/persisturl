import got from 'got'
import test from 'ava'

import isURL from './helpers/isURL.js'
import startServer from './helpers/startServer.js'

test.before(t => {
    return startServer()
    .then(({origin, serverProcess}) => {
        t.context = {origin, serverProcess}
    })
    .catch(err => {
        console.log('before err', err)
        throw err;
    })
})

test.after.always(t => {
    return t.context.serverProcess.kill()
})

test('/first-use', t => {
    const {origin} = t.context

    return got(`${origin}/first-use`)
    .then(({statusCode, headers, body}) => {
        const resp = JSON.parse(body);

        t.is(statusCode, 201)
        t.is(headers['content-type'], 'application/json; charset=utf-8')
        t.true(isURL(resp.store), '.store is a url')
        t.is(headers['location'], resp.store, 'Location header is .store url')
        t.true(isURL(resp.createCaretaker), `.createCaretaker is a url`)
        t.true(isURL(resp['DELETE']), `['DELETE'] is a url`)
    })
});

