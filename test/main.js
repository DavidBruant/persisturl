const {fork} = require('child_process')
const got = require('got')
const test = require('ava')



test.before(t => {
    console.log('before');

    function startServer(log){
        return new Promise((resolve, reject) => {
            const serverProcess = fork('main.js');
    
            serverProcess.on('error', error => {
                console.error('serverProcess error', error)
                reject(error)
            });
            serverProcess.on('exit', error => {
                console.error('serverProcess exit', error)
                reject(error)
            });
    
            serverProcess.on('message', m => {
                const {origin} = m;
    
                console.log('message', m)
    
                resolve({origin, serverProcess})
            });
        })
    }


    return startServer((...args) => console.log(...args))
    .then(({origin, serverProcess}) => {
        console.log('before origin', origin)
        t.context = {origin, serverProcess}
    })
    .catch(err => {
        console.log('before err', err)
        throw err;
    })
    


})

test('/', t => {
    t.pass()
    t.log('context in test' ,t.context)

    const {origin} = t.context

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

test.after(t => {
    return t.context.serverProcess.kill()
})