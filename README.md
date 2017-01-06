# bungienetplatformjs

[![Travis](https://img.shields.io/travis/dazarobbo/bungienetplatformjs.svg?style=flat-square)](https://travis-ci.org/dazarobbo/BungieNetPlatformJS) [![npm](https://img.shields.io/npm/bungienetplatformjs/npm.svg)](https://www.npmjs.com/package/bungienetplatformjs)

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

[https://runkit.com/5865c7bdb1021e0013dc5268/586f45d6d4634d0014843395](## Try)

## Thanks
lowlines, everyone in the BungieNetPlatform group, and of course, Bungie.
