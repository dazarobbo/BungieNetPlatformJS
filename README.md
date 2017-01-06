# BungieNetPlatformJS
node API for the Bungie.net Platform

[![Travis](https://img.shields.io/travis/dazarobbo/BungieNetPlatformJS.svg?style=flat-square)](https://travis-ci.org/dazarobbo/BungieNetPlatformJS) [![npm](https://img.shields.io/npm/v/bungienetplatformjs.svg?style=flat-square)](https://www.npmjs.com/package/bungienetplatformjs)

## Install
```bashp
npm install bungienetplatformjs --save
```

## Usage
```js
const BungieNet = require("bungienetplatformjs").default;

const p = new BungieNet.Platform({
  apiKey: "-api-key-here-"
});

p.helloWorld().then(r => console.log(r.response)); //Hello World
```
<sup>[try this](https://runkit.com/5865c7bdb1021e0013dc5268/586f52479090c40013b47f24)</sup>

## Thanks
lowlines, everyone in the BungieNetPlatform group, and of course, Bungie.
