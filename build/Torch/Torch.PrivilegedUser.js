"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch */
Torch.PrivilegedUser = function () {
  function _class() {
    var o = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, _class);

    /**
     * @type {Object}
     */
    this._data = o;

    this._converted = new Map();

    this._convert();
  }

  _createClass(_class, [{
    key: "_convert",
    value: function _convert() {

      this._converted.set("user", new Torch.User(this._data.user));
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "toString",


    /**
     * @return {String}
     */
    value: function toString() {
      return this.user;
    }
  }, {
    key: "adultMode",
    get: function get() {
      return this._data.adultMode;
    }

    /**
     * @return {String}
     */

  }, {
    key: "email",
    get: function get() {
      return this._data.email;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "emailStatus",
    get: function get() {
      return this._data.emailStatus;
    }

    /**
     * TODO: convert to BigNumber?
     * @return {String}
     */

  }, {
    key: "emailUsage",
    get: function get() {
      return this._data.emailUsage;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "hideDestinyData",
    get: function get() {
      return this._data.hideDestinyData;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isThemeLight",
    get: function get() {
      return this._data.isThemeLight;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "pmToastsEnabled",
    get: function get() {
      return this._data.pmToastsEnabled;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "privacy",
    get: function get() {
      return this._data.privacy;
    }

    /**
     * @return {String}
     */

  }, {
    key: "psnId",
    get: function get() {
      return this._data.psnId;
    }

    /**
     * @return {Array<Number>}
     */

  }, {
    key: "publicCredentialTypes",
    get: function get() {
      return this._data.publicCredentialTypes;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "showFacebookPublic",
    get: function get() {
      return this._data.showFacebookPublic;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "showGamertagPublic",
    get: function get() {
      return this._data.showGamertagPublic;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "showPsnPublic",
    get: function get() {
      return this._data.showPsnPublic;
    }

    /**
     * @return {Torch.User}
     */

  }, {
    key: "user",
    get: function get() {
      return this._converted.get("user");
    }

    /**
     * @return {Array<Number>}
     */

  }, {
    key: "userAcls",
    get: function get() {
      return this._data.userAcls;
    }

    /**
     * TODO: convert to BigNumber?
     * @return {String}
     */

  }, {
    key: "userResearchStatusFlags",
    get: function get() {
      return this._data.userResearchStatusFlags;
    }
  }]);

  return _class;
}();