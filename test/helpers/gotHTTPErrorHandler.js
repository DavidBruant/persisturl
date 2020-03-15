export default function(t){
    return error => {
        t.log('error', error)
        const {response: {statusCode, body}} = error;

        t.log('HTTP Error', statusCode, body)
        t.fail()
    }
}