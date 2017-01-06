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

var _Response = require("./Response.js");

var _Response2 = _interopRequireDefault(_Response);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
   * @param {Frame} frame -
   */
  function PlatformRequest(frame) {
    _classCallCheck(this, PlatformRequest);

    /**
     * @type {Frame}
     */
    var _this = _possibleConstructorReturn(this, (PlatformRequest.__proto__ || Object.getPrototypeOf(PlatformRequest)).call(this));

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

    /**
     * @type {String}
     */
    _this._errorMessage = null;

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
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_httpSuccess",
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                _BungieNet2.default.logger.log("info", "HTTP Success", {
                  frameId: this._frame.id,
                  status: this._responseMessage.statusCode
                });

                this.emit(PlatformRequest.events.httpSuccess, {
                  target: this
                });

                _context.next = 4;
                return this._onHttpSuccess();

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _httpSuccess() {
        return _ref.apply(this, arguments);
      }

      return _httpSuccess;
    }()

    /**
     * @return {undefined}
     */

  }, {
    key: "_httpFail",
    value: function _httpFail() {

      _BungieNet2.default.logger.log("warn", "HTTP Failed", {
        frameId: this._frame.id,
        error: this._errorMessage,
        status: this._responseMessage === undefined ? null : this._responseMessage.statusCode
      });

      this.emit(PlatformRequest.events.httpFail, {
        target: this
      });
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
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "_onHttpSuccess",
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return _Response2.default.parse(this._responseText);

              case 3:
                this.frame.response = _context2.sent;
                _context2.next = 6;
                return this._onResponseParsed();

              case 6:
                _context2.next = 12;
                break;

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2["catch"](0);
                _context2.next = 12;
                return this._onResponseCorrupt();

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 8]]);
      }));

      function _onHttpSuccess() {
        return _ref2.apply(this, arguments);
      }

      return _onHttpSuccess;
    }()

    /**
     * @return {undefined}
     */

  }, {
    key: "_onResponseParsed",
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:

                this.emit(PlatformRequest.events.responseParsed, {
                  target: this
                });

                _context3.next = 3;
                return this._success();

              case 3:
                _context3.next = 5;
                return this._done();

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _onResponseParsed() {
        return _ref3.apply(this, arguments);
      }

      return _onResponseParsed;
    }()

    /**
     * @return {undefined}
     */

  }, {
    key: "_onResponseCorrupt",
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this._error();

              case 2:
                _context4.next = 4;
                return this._done();

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _onResponseCorrupt() {
        return _ref4.apply(this, arguments);
      }

      return _onResponseCorrupt;
    }()

    /**
     * @return {undefined}
     */

  }, {
    key: "_error",
    value: function _error() {
      this.emit(PlatformRequest.events.error, {
        target: this
      });
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
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "__internalBind",
    value: function __internalBind() {
      this._options.uri = this._frame.request.uri.toString();
      this._options.method = this._frame.request.method;
      this._options.body = JSON.stringify(this._frame.request.data);
    }

    /**
     * @return {undefined}
     */

  }, {
    key: "execute",
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this._beforeSend();

              case 2:
                _context6.next = 4;
                return this.__internalBind();

              case 4:

                _BungieNet2.default.logger.log("info", "Executing request", {
                  frameId: this._frame.id,
                  line: this._options.method + " " + this._options.uri
                });

                (0, _request2.default)(this._options, function () {
                  var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(err, response, body) {
                    return regeneratorRuntime.wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:

                            _this2._responseMessage = response;
                            _this2._responseText = body;
                            _this2._errorMessage = err ? err.message : null;

                            _BungieNet2.default.logger.log("debug", "HTTP Response", {
                              frameId: _this2._frame.id,
                              error: _this2._errorMessage,
                              response: response,
                              body: body
                            });

                            if (!(err || response.statusCode !== _httpStatusCodes2.default.OK)) {
                              _context5.next = 15;
                              break;
                            }

                            _context5.next = 7;
                            return _this2._httpFail();

                          case 7:
                            _context5.next = 9;
                            return _this2._onHttpDone();

                          case 9:
                            _context5.next = 11;
                            return _this2._error();

                          case 11:
                            _context5.next = 13;
                            return _this2._done();

                          case 13:
                            _context5.next = 21;
                            break;

                          case 15:
                            _context5.next = 17;
                            return _this2._httpSuccess();

                          case 17:
                            _context5.next = 19;
                            return _this2._onHttpDone();

                          case 19:
                            _context5.next = 21;
                            return _this2._onHttpSuccess();

                          case 21:
                          case "end":
                            return _context5.stop();
                        }
                      }
                    }, _callee5, _this2);
                  }));

                  return function (_x, _x2, _x3) {
                    return _ref6.apply(this, arguments);
                  };
                }());

              case 6:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function execute() {
        return _ref5.apply(this, arguments);
      }

      return execute;
    }()
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