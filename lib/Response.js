"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BungieNet = require("./BungieNet.js");

var _BungieNet2 = _interopRequireDefault(_BungieNet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * BungieNet.Platform.Response
 *
 * Represents an application response from the bungie.net platform. This type
 * should be constructed using an object from bungie.net (ie. JSON).
 *
 * This type complements BungieNet.Platform.Request.
 */
var Response = function () {

  /**
   * @param {Object} o -
   */
  function Response(o) {
    _classCallCheck(this, Response);

    this.errorCode = o.ErrorCode;
    this.errorStatus = o.ErrorStatus;
    this.message = o.Message;
    this.messageData = o.MessageData;
    this.response = o.Response;
    this.throttleSeconds = o.ThrottleSeconds;
  }

  /**
   * Whether this response represents a platform application error
   * @type {Boolean}
   */


  _createClass(Response, [{
    key: "isError",
    get: function get() {
      return this.errorCode !== _BungieNet2.default.enums.platformErrorCodes.success;
    }

    /**
     * Whether this response was throttled
     * @return {Boolean} -
     */

  }, {
    key: "isThrottled",
    get: function get() {

      switch (this.errorCode) {
        case _BungieNet2.default.enums.platformErrorCodes.throttle_limit_exceeded:
        case _BungieNet2.default.enums.platformErrorCodes.throttle_limit_exceeded_minutes:
        case _BungieNet2.default.enums.platformErrorCodes.throttle_limit_exceeded_seconds:
        case _BungieNet2.default.enums.platformErrorCodes.throttle_limit_exceeded_momentarily:
        case _BungieNet2.default.enums.platformErrorCodes.per_endpoint_request_throttle_exceeded:
          return true;
        default:
          return false;
      }
    }

    /**
     * Parses a response from the bungie.net platform
     * @param {String} text -
     * @return {Promise.<Response>} -
     */

  }], [{
    key: "parse",
    value: function parse(text) {

      var obj = undefined;

      try {
        obj = JSON.parse(text);
      } catch (err) {
        return Promise.reject(undefined);
      }

      return Promise.resolve(new Response(obj));
    }
  }]);

  return Response;
}();

exports.default = Response;