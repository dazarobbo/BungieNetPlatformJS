"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Cookies = require("./Cookies.js");

var _Cookies2 = _interopRequireDefault(_Cookies);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
     * @return {Promise.<Boolean>}
     */
    value: function authenticated() {
      return new Promise(function (resolve) {

        //if cookie found, resolve as true
        //if it isn't found, resolve as false
        //TODO: does this make sense?
        return _Cookies2.default.get("bungleatk").then(function () {
          return resolve(true);
        }, function () {
          return resolve(false);
        });
      });
    }

    /**
     * Whether there is any trace of an existing user
     * @return {Promise.<Cookie[]>}
     */

  }, {
    key: "exists",
    value: function exists() {
      return new Promise(function (resolve, reject) {
        _Cookies2.default.getMatching(function (c) {
          return c;
        }).then(function (cookies) {
          return resolve(cookies.length > 0);
        }, reject);
      });
    }

    /**
     * Returns the CSRF token for API requests
     * @return {Promise.<String>}
     */

  }, {
    key: "getCsrfToken",
    value: function getCsrfToken() {
      //token is the value of the bungled cookie
      return _Cookies2.default.getValue("bungled");
    }

    /**
     * Returns the member id of the current user
     * @return {Promise.<Number>}
     */

  }, {
    key: "getMembershipId",
    value: function getMembershipId() {
      return new Promise(function (resolve, reject) {
        _Cookies2.default.getValue("bungleme").then(function (id) {
          return resolve(parseInt(id, 10));
        }, reject);
      });
    }

    /**
     * Returns the set bungie.net theme
     * @return {Promise.<String>}
     */

  }, {
    key: "getTheme",
    value: function getTheme() {
      return cookies.getValue("bungletheme");
    }

    /**
     * Returns the current user's locale
     * @return {Promise.<String>} resolves with string if successful, otherwise
     * rejected with null
     */

  }, {
    key: "getLocale",
    value: function getLocale() {
      return new Promise(function (resolve, reject) {
        _Cookies2.default.getValue("bungleloc").then(function (str) {

          //parse the locale from the cookie
          var arr = /&?lc=(.+?)(?:$|&)/i.exec(str);

          //if successful, resolve it
          if (arr.length >= 1) {
            return resolve(arr[1]);
          }

          //otherwise reject as unable to find
          return reject(null);
        }, function () {
          return reject(null);
        });
      });
    }
  }]);

  return CurrentUser;
}();

exports.default = CurrentUser;
;
//# sourceMappingURL=CurrentUser.js.map