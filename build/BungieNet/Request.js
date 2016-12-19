"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
var Request =

/**
 * @param  {URI} uri - relative URI from bungie.net/Platform
 * @param  {String} [method = "GET"] - HTTP method
 * @param  {String} [data = void 0] - data to send to the server
 */
function Request(uri) {
  var method = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "GET";
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

  _classCallCheck(this, Request);

  this.uri = uri;
  this.method = method;
  this.data = data;
};

exports.default = Request;
//# sourceMappingURL=Request.js.map