import express from 'express'
import parseCLIArgs from 'minimist'

const app = express()
const argv = parseCLIArgs(process.argv)
const port = argv.port && Number(argv.port) || 3000

console.log('port', port)

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
    if(process.send){
        process.send('ready')
    }
})

if(process.send){
    process.on('uncaughtException', err => {
        process.send(err)
        process.kill(-1)
    })
    process.on('unhandledRejection', err => {
        process.send(err)
        process.kill(-1)
    })
}