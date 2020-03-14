import {fork} from 'child_process'

export default function startServer(){
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
            resolve({origin, serverProcess})
        });
    })
}