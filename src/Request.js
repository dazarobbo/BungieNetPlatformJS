/**
 * Platform.Request
 *
 * Pass an instance of this class to Platform._serviceRequest with
 * details of a specific endpoint. This class is intentionally basic.
 *
 * The URI should be relative to the base bungie.net platform path. For example,
 * "/Activity/Following/Users/" is correct, but
 * "bungie.net/Platform/Activity/Following/Users/" is not.
 *
 * This type complements Platform.Response.
 */
export default class Request {

  /**
   * @param {URI} uri - relative URI from bungie.net/Platform
   * @param {String} [method = "GET"] - HTTP method
   * @param {String} [data = void 0] - data to send to the server
   */
  constructor(uri, method = "GET", data = undefined) {
    this.uri = uri;
    this.method = method;
    this.data = data;
  }

}
