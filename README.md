## Install
```bashp
npm install bungienetplatformjs
```
## Usage
```js
const BungieNet = require("bungienetplatformjs").default;

const p = new BungieNet.Platform({
  apiKey: "-api-key-here-"
});

p.helloWorld().then(r => console.log(r.response)); //Hello World
```
