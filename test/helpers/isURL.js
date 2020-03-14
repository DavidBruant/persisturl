export default function(string){
    if(typeof string !== 'string')
        return false;

    try{
        const u = new URL(string);
        return true;
    }
    catch{
        return false;
    }
}