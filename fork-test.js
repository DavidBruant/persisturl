const {fork} = require('child_process')
const serverProcess = fork('main.js');


serverProcess.on('error', error => {
    console.error('serverProcess error', error)
    //reject(error)
});
serverProcess.on('exit', error => {
    console.error('serverProcess exit', error)
    //reject(error)
});

serverProcess.on('message', m => {
    const {origin} = m;

    console.log('message', m)

    process.exit()
});
