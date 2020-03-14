const {fork} = require('child_process')
const got = require('got')
const test = require('ava')


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