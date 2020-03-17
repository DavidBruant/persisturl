export default function(stored, res){
    res.status(200)
        .set('Content-Type', stored.mediaType)
        .send(stored.content)
}