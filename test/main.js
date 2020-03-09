import {spawn} from 'child_process'
import got from 'got'
import test from 'ava'

const PORT = 61479;

const origin = `http://localhost:${PORT}`

function startServer(port, log){
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('node', ['main.js', '--port', port], {stdio: 'inherit'});
        serverProcess.on('error', reject);
        //serverProcess.on('exit', reject);

        serverProcess.on('message', m => {
            if(m === 'ready'){
                resolve()
                log('yo, ready')
            }
            else
                log('message from server', m)
        });

        //server.stdout.pipe(process.stdout)

        setTimeout(resolve, 3000)
    })
}

test.before(t => {
    t.log('before');
    return startServer(PORT, t.log);
})

test('/', t => {
    return got(`${origin}/`)
    .then(resp => {
        t.log('yo', resp)
        t.pass()
    })
});

test.skip('/new', async t => {
    return got.post(`${origin}/new`, {body: '{"a":1}'})
    .then(({url, body}) => {
        throw `assert new URL + body contains put/delete/patch/meta capabilities`
    })
    .then(() => {
        throw `got url and check it has the posted content`
    })
    .then(() => {
        throw `got.put url and check it replaces the content`
    })
    .then(() => {
        throw `got.delete url and make sure a get returns a 404`
    })
});

test.skip('/new?separate', async t => {
    return got.post(`${origin}/new`, {body: '{"a":1}'})
    .then(({url, body}) => {
        throw `assert new URL + body contains different get/put/delete/patch capabilities`
    })
    .then(() => {
        throw `got url and check it has the posted content`
    })
    .then(() => {
        throw `got.put url and check it replaces the content  + make sure other urls don't work for PUT `
    })
    .then(() => {
        throw `make sure other urls don't work for DELETE + got.delete url and make sure all urls returns a 404`
    })
});

test.skip('/new?group', async t => {
    return got.post(`${origin}/new`, {body: '{"a":1}'})
    .then(({url, body}) => {
        throw `assert new URL + body contains different get/delete/post capabilities + post is a create capability within the group`
    })
    .then(() => {
        throw `got url and check it has the group content list`
    })
    .then(() => {
        throw `got.post url and check it creates a content  + make sure other urls don't work for PUT `
    })
    .then(() => {
        throw `make sure other urls don't work for DELETE + got.delete url and make sure all urls returns a 404`
    })
});

test.skip('/new?group&separate', async t => {
    return got.post(`${origin}/new`, {body: '{"a":1}'})
    .then(({url, body}) => {
        throw `assert new URL + body contains different get/delete/post capabilities + post is a create capability within the group`
    })
    .then(() => {
        throw `got url and check it has the group content list`
    })
    .then(() => {
        throw `got.post url and check it creates a content  + make sure other urls don't work for PUT `
    })
    .then(() => {
        throw `make sure other urls don't work for DELETE + got.delete url and make sure all urls returns a 404`
    })
});