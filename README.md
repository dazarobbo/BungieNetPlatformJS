[![Build Status](https://travis-ci.org/dazarobbo/BungieNetPlatformJS.svg?branch=master)](https://travis-ci.org/dazarobbo/BungieNetPlatformJS)
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
