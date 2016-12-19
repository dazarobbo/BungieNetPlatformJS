## Install
```bashp
npm install bungienetplatformjs
```
## Usage
```js
import BungieNet from "bungienetplatformjs";

const p = new BungieNet.Platform({
  apiKey: "-api-key-here-"
});

p.helloWorld().then(r => console.log(r.response)); //Hello World
```
