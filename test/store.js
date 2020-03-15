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
        t.true(isURL(resp.PUT), `.PUT is a url`)
        t.true(isURL(resp.DELETE), `.DELETE is a url`)
    })
    .catch(gotHTTPErrorHandler(t))
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
    .catch(gotHTTPErrorHandler(t))
});

test('PUT capability on store enables to retrieve the content as well as replacing it', t => {
    const {store} = t.context.firstUseBundle

    const content = {c:25};
    const otherContent = {d:76};

    return got.post(store, {json: content})
    .then(({body}) => {
        const {PUT, GET} = JSON.parse(body);

        return got.get(PUT, {responseType: 'json'})
        .then(({statusCode, body}) => {
            t.is(statusCode, 200)
            t.deepEqual(body, content, 'GET requests work on PUT urls')
        })
        .then(() => {
            return got.put(PUT, {json: otherContent})
            .then(({statusCode}) => {
                t.is(statusCode, 204, 'PUT on PUT returns a 204')
            })
        })
        .then(() => {
            return got.get(PUT, {responseType: 'json'})
            .then(({statusCode, body}) => {
                t.is(statusCode, 200)
                t.deepEqual(body, otherContent, 'GET requests on PUT work after changing the content does return the new content')
            })
        })
        .then(() => {
            return got.get(GET, {responseType: 'json'})
            .then(({statusCode, body}) => {
                t.is(statusCode, 200)
                t.deepEqual(body, otherContent, 'GET requests on GET work after changing the content does return the new content')
            })
        })
    })
    .catch(gotHTTPErrorHandler(t))
});

test('DELETE capability on store enables to retrieve the content as well as removing it', t => {
    const {store} = t.context.firstUseBundle

    const content = {e:99};

    return got.post(store, {json: content})
    .then(({body}) => {
        const {PUT, GET, DELETE} = JSON.parse(body);

        return got.get(DELETE, {responseType: 'json'})
        .then(({statusCode, body}) => {
            t.is(statusCode, 200)
            t.deepEqual(body, content, 'GET requests work on DELETE urls')
        })
        .then(() => {
            return got.delete(DELETE)
            .then(({statusCode}) => {
                t.is(statusCode, 204, 'DELETE on DELETE returns a 204')
            })
        })
        .then(() => {
            return got.get(PUT)
            .catch(({response: {statusCode}}) => {
                t.is(statusCode, 410)
            })
        })
        .then(() => {
            return got.get(DELETE)
            .catch(({response: {statusCode}}) => {
                t.is(statusCode, 410)
            })
        })
        .then(() => {
            return got.get(GET)
            .catch(({response: {statusCode}}) => {
                t.is(statusCode, 410)
            })
        })
    })
    .catch(gotHTTPErrorHandler(t))
});