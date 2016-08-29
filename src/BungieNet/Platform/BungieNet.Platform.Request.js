/* globals BungieNet: true */
/**
 * BungieNet.Platform.Request
 *
 * Pass an instance of this class to BungieNet.Platform._serviceRequest with
 * details of a specific endpoint.
 *
 * The URI should be relative to the base bungie.net platform path. For example,
 * "/Activity/Following/Users/" is correct, but
 * "bungie.net/Platform/Activity/Following/Users/" is not.
 *
 * This type complements BungieNet.Platform.Response.
 */
BungieNet.Platform.Request = class {

  /**
   * @param  {URI} uri - relative URI from bungie.net/Platform
   * @param  {String} [method = "GET"] - HTTP method
   * @param  {String} [data = void 0] - data to send to the server
   * @param  {Object} [headers = {}] - additional request headers
   */
  constructor(uri, method = "GET", data = void 0, headers = {}) {

    this.uri = uri;
    this.method = method;
    this.data = data;
    this.headers = headers;

    //Set of http specific options to be set
    this.options = new Set();

  }

  /**
   * Internal set of function callbacks to set http-specific options before the
   * request is sent. Function should be Promise-d.
   * @return {Set}
   */
  get options() {
    return this.options;
  }

};
