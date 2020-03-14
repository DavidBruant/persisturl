import got from 'got'
import test from 'ava'

import isURL from './helpers/isURL.js'
import startServer from './helpers/startServer.js'

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


test('GET on initial store capability', t => {
    const {store} = t.context.firstUseBundle

    return got.get(store)
    .catch(({response: {statusCode}}) => {
        t.is(statusCode, 405)
    })
});

test('POST on initial store capability', t => {
    const {store} = t.context.firstUseBundle

    return got.post(store, {json: {a:1}})
    .then(({statusCode, headers, body}) => {
        const resp = JSON.parse(body);

        t.is(statusCode, 201)
        t.is(headers['content-type'], 'application/json; charset=utf-8')
        t.true(isURL(resp.GET), '.GET is a url')
        t.is(headers['location'], resp.GET, 'Location header is .GET url')
        t.true(isURL(resp.PUT, `.PUT is a url`))
        t.true(isURL(resp.DELETE, `.DELETE is a url`))
    })
});

test('GET capability on store retrieves the stored content', t => {
    const {store} = t.context.firstUseBundle

    const content = {b:37};

    return got.post(store, {json: content})
    .then(({body}) => {
        const resp = JSON.parse(body);

        return got.get(resp.GET, {responseType: 'json'})
        .then(({statusCode, headers, body}) => {
            t.is(statusCode, 200)
            t.deepEqual(body, content)
        })
    })
    .catch(({response: {statusCode, body}}) => {
        t.log('HTTP Error', statusCode, body)
        t.fail()
    })
});

