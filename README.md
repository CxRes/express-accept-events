# Express-Accept-Events

A Connect/Express style middleware to parse the `Accept-Events` header field specified in [Per Resource Events](https://cxres.github.io/prep/draft-gupta-httpbis-per-resource-events.html).

## Installation

Install **Express-Accept-Events** using your favourite package manager.

```sh
npm|pnpm|yarn add express-accept-events
```

## Usage

In case one is using an Express server:

```js
import AcceptEvents from "express-accept-events";
const app = express();
app.use(acceptEvents);
```

The middleware populates `req.acceptEvents` with a list of notification protocols and their corresponding parameters (sorted by the value of a `q` parameter, if provided) in `GET` and `POST` requests. For Example, the following HTTP request:

```http
GET /notifications HTTP/1.1
Host: example.com
Accept: text/plain
Accept-Events: "prep"; accept="message/rfc822"; q=0.9, "solid"; type="WebSocket2023"
```

with the GET handler, so specified:

```js
app.get('/foo', (req, res) => {
  console.log(req.acceptEvents);
});
```

will result in the output:

```sh
[
  [ "solid", Map(1) { "type" => "WebSocket2023" } ]
  [ "prep", Map(2) { "accept" => "message/rfc822", "q" => 0.9 } ]
]
```

## Errors

In case the middleware fails to parse the `Accept-Events` header field, the `req.acceptEvents` property is not created.

## Copyright and License

Copyright © 2024, [Rahul Gupta](https://cxres.pages.dev/profile#i)

The source code in this repository is released under the [Mozilla Public License v2.0](./LICENSE).
