"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * BungieNet.Cookies
 *
 * Interface to examine/extract bungie.net cookies from a given cookie
 * provider.
 *
 * A cookie provider must implement at least the following methods:
 *
 * [public] getAll( void ) : Promise(array of Cookie)
 * - return all cookies (*.bungie.net only)
 *
 *
 * Cookie must implement at least the following properties:
 *
 * name: string
 * session: bool
 * value: string
 *
 *
 * The cookie provider should be set similar to:
 * 	BungieNet.Cookies.provider = new CustomCookieProvider();
 */
var Cookies = function () {
  function Cookies() {
    _classCallCheck(this, Cookies);
  }

  _createClass(Cookies, null, [{
    key: "get",


    /**
     * Returns the cookie with the given name
     * @param  {String} name cookie name
     * @return {Promise.<Cookie>} cookie
     */
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(name) {
        var cookies;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Cookies.getMatching(function (c) {
                  return c.name === name;
                });

              case 2:
                cookies = _context.sent;
                return _context.abrupt("return", cookies[0]);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function get(_x) {
        return _ref.apply(this, arguments);
      }

      return get;
    }()

    /**
     * Returns an array of cookies which pass the predicate function
     * @param  {Function} predicate return true to include
     * @return {Promise.<Cookie[]>} array
     */

  }, {
    key: "getMatching",
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(predicate) {
        var cookies;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return Cookies.provider.getAll();

              case 2:
                cookies = _context2.sent;
                return _context2.abrupt("return", cookies.filter(predicate));

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getMatching(_x2) {
        return _ref2.apply(this, arguments);
      }

      return getMatching;
    }()

    /**
     * Returns an array of session cookies
     * @return {Promise.<Cookie[]>} array
     */

  }, {
    key: "getSessionCookies",
    value: function getSessionCookies() {
      return Cookies.getMatching(function (c) {
        return c.session;
      });
    }

    /**
     * Returns the value for a given cookie name
     * @param  {String} name - name of cookie
     * @return {Promise.<String>} string
     */

  }, {
    key: "getValue",
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(name) {
        var cookie;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return Cookies.get(name);

              case 2:
                cookie = _context3.sent;
                return _context3.abrupt("return", cookie.value);

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getValue(_x3) {
        return _ref3.apply(this, arguments);
      }

      return getValue;
    }()
  }]);

  return Cookies;
}();

/**
 * Cookie provider interface
 * @type {*}
 */


exports.default = Cookies;
Cookies.provider = null;