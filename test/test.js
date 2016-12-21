const BungieNet = require("../lib/index.js").default;
const chai = require("chai");
const nock = require("nock");

const expect = chai.expect;

nock("https://www.bungie.net")
  .get("/Platform/HelloWorld/")
  .replyWithFile(200, "./test/responses/HelloWorld.json");


describe("BungieNet.Platform", () => {

  const p = new BungieNet.Platform({});
  let resp;

  before(done => {
    p.helloWorld().then(r => {
      resp = r;
      return done();
    });
  });

  it("should return Hello World", (done) => {
    expect(resp.response).to.equal("Hello World");
    return done();
  });

});
