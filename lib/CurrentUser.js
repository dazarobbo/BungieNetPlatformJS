"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Cookies = require("./Cookies.js");

var _Cookies2 = _interopRequireDefault(_Cookies);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * BungieNet.CurrentUser
 *
 * Functions specific to the current user or client
 */
var CurrentUser = function () {
  function CurrentUser() {
    _classCallCheck(this, CurrentUser);
  }

  _createClass(CurrentUser, null, [{
    key: "authenticated",


    /**
     * Returns a bool for whether the user is signed in based on cookie existence
     * @return {Promise.<Boolean>} bool
     */
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return _Cookies2.default.get("bungleatk");

              case 3:
                return _context.abrupt("return", true);

              case 6:
                _context.prev = 6;
                _context.t0 = _context["catch"](0);
                return _context.abrupt("return", false);

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 6]]);
      }));

      function authenticated() {
        return _ref.apply(this, arguments);
      }

      return authenticated;
    }()

    /**
     * Whether there is any trace of an existing user
     * @return {Promise.<Boolean>} true if exists
     */

  }, {
    key: "exists",
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var cookies;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _Cookies2.default.getMatching(function (c) {
                  return c;
                });

              case 2:
                cookies = _context2.sent;
                return _context2.abrupt("return", cookies.length > 0);

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function exists() {
        return _ref2.apply(this, arguments);
      }

      return exists;
    }()

    /**
     * Returns the CSRF token for API requests
     * @return {Promise.<String>} string
     */

  }, {
    key: "getCsrfToken",
    value: function getCsrfToken() {
      //token is the value of the bungled cookie
      return _Cookies2.default.getValue("bungled");
    }

    /**
     * Returns the member id of the current user
     * @return {Promise.<Number>} id
     */

  }, {
    key: "getMembershipId",
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var cookie;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _Cookies2.default.get("bungleme");

              case 2:
                cookie = _context3.sent;
                return _context3.abrupt("return", parseInt(cookie.value, 10));

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getMembershipId() {
        return _ref3.apply(this, arguments);
      }

      return getMembershipId;
    }()

    /**
     * Returns the set bungie.net theme
     * @return {Promise.<String>} theme
     */

  }, {
    key: "getTheme",
    value: function getTheme() {
      return _Cookies2.default.getValue("bungletheme");
    }

    /**
     * Returns the current user's locale
     * @return {Promise.<String>} resolves with string if successful, otherwise
     * rejected with null
     */

  }, {
    key: "getLocale",
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var cookie, arr;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return _Cookies2.default.get("bungleloc");

              case 2:
                cookie = _context4.sent;
                arr = /&?lc=(.+?)(?:$|&)/i.exec(cookie.value);

                if (!(arr.length >= 1)) {
                  _context4.next = 6;
                  break;
                }

                return _context4.abrupt("return", arr[1]);

              case 6:
                return _context4.abrupt("return", null);

              case 7:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getLocale() {
        return _ref4.apply(this, arguments);
      }

      return getLocale;
    }()
  }]);

  return CurrentUser;
}();

exports.default = CurrentUser;