/**
 * Request to the Bungie.net Platform
 * @type {BungieNet.Platform.Request}
 */
BungieNet.Platform.Request = class{
  constructor(uri, method = "GET", data = void 0){
    this.uri = uri;
    this.method = method;
    this.data = data;
  }
};
