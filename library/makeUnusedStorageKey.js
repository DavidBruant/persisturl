function r(){ return Math.random().toString(36).slice(2) }

function makeRandomString(){
    return r() + r() + r()
}

export default function(map){
    let attempt = makeRandomString()

    while(map.has(attempt)){
        attempt = makeRandomString()
    }

    return attempt
}