"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BungieNet = require("./BungieNet.js");

var _BungieNet2 = _interopRequireDefault(_BungieNet);

var _events = require("events");

var _events2 = _interopRequireDefault(_events);

var _httpStatusCodes = require("http-status-codes");

var _httpStatusCodes2 = _interopRequireDefault(_httpStatusCodes);

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

var _requestDebug = require("request-debug");

var _requestDebug2 = _interopRequireDefault(_requestDebug);

var _Response = require("./Response");

var _Response2 = _interopRequireDefault(_Response);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * This class does NOT represent a response from bungie.net. This class exists
 * to handle the workflow between making a request and receiving a response.
 */
var PlatformRequest = function (_EventEmitter) {
  _inherits(PlatformRequest, _EventEmitter);

  /**
   * @param {Platform.Frame} frame -
   */
  function PlatformRequest(frame) {
    _classCallCheck(this, PlatformRequest);

    var _this = _possibleConstructorReturn(this, (PlatformRequest.__proto__ || Object.getPrototypeOf(PlatformRequest)).call(this));

    (0, _requestDebug2.default)(_request2.default, _this._networkDebug);

    /**
     * @type {Platform.Frame}
     */
    _this._frame = frame;

    /**
     * request {@link https://github.com/request/request#requestoptions-callback|options}
     * These are applied immediately prior to the request occurring
     * @type {Object}
     */
    _this._options = {
      headers: {}
    };

    /**
     * @type {http.IncomingMessage}
     */
    _this._responseMessage = null;

    /**
     * @type {String}
     */
    _this._responseText = null;

    return _this;
  }

  /**
   * @return {Frame} frame
   */


  _createClass(PlatformRequest, [{
    key: "_beforeSend",


    /**
     * @return {undefined}
     */
    value: function _beforeSend() {
      this.emit(PlatformRequest.events.beforeSend, {
        target: this
      });
      return Promise.resolve();
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_httpSuccess",
    value: function _httpSuccess() {
      var _this2 = this;

      return new Promise(function (resolve) {

        _BungieNet2.default.logger.log("info", "HTTP Success", {
          frameId: _this2._frame.id,
          status: _this2._responseMessage.statusCode
        });

        _this2.emit(PlatformRequest.events.httpSuccess, {
          target: _this2
        });

        return _this2._onHttpSuccess().then(function () {
          return resolve();
        });
      });
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_httpFail",
    value: function _httpFail() {
      _BungieNet2.default.logger.log("warn", "HTTP Failed", {
        frameId: this._frame.id,
        status: this._responseMessage.statusCode
      });
      this.emit(PlatformRequest.events.httpFail, {
        target: this
      });
      return Promise.resolve();
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_onHttpDone",
    value: function _onHttpDone() {
      this.emit(PlatformRequest.events.httpDone, {
        target: this
      });
      return Promise.resolve();
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_onHttpSuccess",
    value: function _onHttpSuccess() {
      var _this3 = this;

      return new Promise(function (resolve) {
        _Response2.default.parse(_this3._responseText).then(function (r) {
          return _this3._onResponseParsed(r);
        }, function () {
          return _this3._onResponseCorrupt();
        }).then(function () {
          return resolve();
        });
      });
    }

    /**
     * @param {Response} response -
     * @return {undefined}
     */

  }, {
    key: "_onResponseParsed",
    value: function _onResponseParsed(response) {
      var _this4 = this;

      return new Promise(function (resolve) {

        _this4.frame.response = response;

        _this4.emit(PlatformRequest.events.responseParsed, {
          target: _this4
        });

        _this4._success().then(function () {
          return _this4._done();
        });
      });
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_onResponseCorrupt",
    value: function _onResponseCorrupt() {
      var _this5 = this;

      return new Promise(function (resolve) {
        _this5._error().then(function () {
          return _this5._done();
        }).then(function () {
          return resolve();
        });
      });
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_error",
    value: function _error() {
      this.emit(PlatformRequest.events.error, {
        target: this
      });
      return Promise.resolve();
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_success",
    value: function _success() {
      this.emit(PlatformRequest.events.success, {
        target: this
      });
      return Promise.resolve();
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_done",
    value: function _done() {
      this.emit(PlatformRequest.events.done, {
        target: this
      });
      return Promise.resolve();
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "__internalBind",
    value: function __internalBind() {

      //bind all information to the _options object
      this._options.uri = this._frame.request.uri.toString();
      this._options.method = this._frame.request.method;
      this._options.body = this._frame.request.data;
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "execute",
    value: function execute() {
      var _this6 = this;

      this._beforeSend().then(function () {

        _this6.__internalBind();

        _BungieNet2.default.logger.log("info", "Executing request", {
          frameId: _this6._frame.id,
          line: _this6._options.method + " " + _this6._options.uri
        });

        (0, _request2.default)(_this6._options, function (err, response, body) {

          _this6._responseMessage = response;
          _this6._responseText = body;

          if (err || response.statusCode !== _httpStatusCodes2.default.OK) {
            return _this6._httpFail().then(function () {
              return _this6._onHttpDone();
            }).then(function () {
              return _this6._error();
            }).then(function () {
              return _this6._done();
            });
          }

          return _this6._httpSuccess().then(function () {
            return _this6._onHttpDone();
          }).then(function () {
            return _this6._onHttpSuccess();
          });
        });
      });
    }
  }, {
    key: "frame",
    get: function get() {
      return this._frame;
    }

    /**
     * @return {Object} request options
     */

  }, {
    key: "options",
    get: function get() {
      return this._options;
    }

    /**
     * @param {String} type -
     * @param {Object} data -
     * @param {String} r -
     * @return {undefined}
     */

  }], [{
    key: "_networkDebug",
    value: function _networkDebug(type, data, r) {
      _BungieNet2.default.logger.log("verbose", type, data);
    }
  }]);

  return PlatformRequest;
}(_events2.default);

/**
 * Events generated by a PlatformRequest instance
 * @type {Object}
 */


exports.default = PlatformRequest;
PlatformRequest.events = {

  beforeSend: "beforeSend",

  httpSuccess: "httpSuccess",
  httpFail: "httpFail",
  httpDone: "httpDone",

  responseParsed: "responseParsed",

  success: "success",
  error: "error",
  done: "done"

};
//# sourceMappingURL=PlatformRequest.js.map