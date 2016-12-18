"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BungieNet = require("./BungieNet.js");

var _BungieNet2 = _interopRequireDefault(_BungieNet);

var _Error = require("./Error.js");

var _Error2 = _interopRequireDefault(_Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
     * @param  {String} name
     * @return {Promise.<Cookie>}
     */
    value: function get(name) {
      return new Promise(function (resolve, reject) {
        Cookies.getMatching(function (c) {
          return c.name === name;
        }).then(function (cookies) {

          if (cookies.length === 0) {
            return reject(new _BungieNet2.default.Error(null, _Error2.default.codes.no_cookie_by_name));
          }

          return resolve(cookies[0]);
        }, reject);
      });
    }

    /**
     * Returns an array of cookies which pass the predicate function
     * @param  {Function} predicate
     * @return {Promise.<Cookie[]>}
     */

  }, {
    key: "getMatching",
    value: function getMatching(predicate) {
      return new Promise(function (resolve, reject) {

        try {
          Cookies.provider.getAll().then(function (cookies) {
            return resolve(cookies.filter(predicate));
          });
        } catch (ex) {
          return reject(new _BungieNet2.default.Error(null, _Error2.default.codes.no_cookie_provider));
        }
      });
    }

    /**
     * Returns an array of session cookies
     * @return {Promise.<Cookie[]>}
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
     * @return {Promise.<String>}
     */

  }, {
    key: "getValue",
    value: function getValue(name) {
      return new Promise(function (resolve, reject) {
        Cookies.get(name).then(function (cookie) {
          return resolve(cookie.value);
        }, reject);
      });
    }
  }]);

  return Cookies;
}();

exports.default = Cookies;
;

/**
 * Cookie provider interface
 * @type {*}
 */
Cookies.provider = null;
//# sourceMappingURL=Cookies.js.map