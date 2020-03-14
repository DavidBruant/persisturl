# persisturl

[Capability URL](https://w3ctag.github.io/capability-urls/)-based storage

## Throwing data to a url

i just want to [PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT) data into a URL and be done with it

i don't want to create an account

i want to share my data with others without having them to create accounts


## Install

In a server with git, node.js and npm, run:

```sh
git clone # url
cd persisturl
npm install
npm start
```

## API

### First use

A (`GET`) `/first-use` endpoint can be used by the person installing the server
This url can only be used once. It becomes unavailable afterwards. It returns a JSON body

```json
{
    "store": "http://capability-url.example/aaaaa...",
    "create-caretaker-for": "http://capability-url.example/bbbbb...",
    "DELETE": "http://capability-url.example/ccccc...",
}
```

### Store capability

- **Request** `POST <url> <body>`
- **Response**
`201`
```json
{
    "GET": "http://capability-url.example/ddddd...",
    "PUT": "http://capability-url.example/eeeee...",
    "DELETE": "http://capability-url.example/ggggg..."
}
```
The `Location` header also contains the `PUT` url. The `PUT` and `DELETE` urls can also be used for `GET`

This requests stores the body in the server. The return value is a bundle of capabilities to GET/PUT/DELETE on the resource


### create-caretaker-for capability

- **Request** `POST <url> <body>`
    - `body` is a `url` to create a caretaker for. It works with any url of any type. Arguments can be provided to restrict the newly created resource in a way or another
    TODO : design and document the various arguments for the various resource types
- **Response**
```json
{
    "<type>": "http://capability-url.example/hhhhh...",
    "revoke": "http://capability-url.example/iiiii..."
}
```


