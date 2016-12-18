const BungieNet = require("../build/BungieNetJs.js").default;
const BigNumber = require("bignumber.js");
const winston = require("winston");
const request = require("request");


BungieNet.logger.add(winston.transports.Console, {
  timestamp: function() {
    return new Date().toLocaleString()
  },
  prettyPrint: true,
  colorize: true,
  silent: false,
  level: "verbose"
});

BungieNet.logger.cli();


let p = new BungieNet.Platform({
  apiKey: "49380b64725a497598c0d3cb140b002f",
  cookieJar: true
});

p.addPlugin(new BungieNet.Platform.Plugin.CookieJarMemoryPlugin());

p.getCurrentUser()
  .then(r => console.log(r.response), r => console.log(r))
  .catch(e => console.log(e))
  .then(() => {

    p.helloWorld();

  });
