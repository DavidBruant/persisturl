export default function(t){
    return ({response: {statusCode, body}}) => {
        t.log('HTTP Error', statusCode, body)
        t.fail()
    }
}