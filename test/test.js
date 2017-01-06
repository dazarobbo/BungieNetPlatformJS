const BungieNet = require("../lib/BungieNet.js").default;
const chai = require("chai");
const nock = require("nock");
const winston = require("winston");
const expect = chai.expect;

const p = new BungieNet.Platform({});
let resp;

BungieNet.logger.add(winston.transports.Console, {
  level: "debug",
  colorize: true
});

describe("BungieNet.Platform", () => {

  nock("https://www.bungie.net")
    .get("/Platform/HelloWorld/")
    .replyWithFile(200, "./test/responses/HelloWorld.json");

  before(done => {
    p.helloWorld().then(r => {
      resp = r;
      return done();
    });
  });

  it("should return Hello World", done => {
    expect(resp.response).to.equal("Hello World");
    return done();
  });

});

describe("BungieNet.Platform network", () => {

  let didFail = false;

  nock("https://www.bungie.net")
    .get("/Platform/HelloWorld/")
    .replyWithError("Test error message");

  before(done => {
    p.helloWorld().then(() => { }, () => {
      didFail = true;
      return done();
    });
  });

  it("should fail", done => {
    expect(didFail).to.equal(true);
    return done();
  });

});
