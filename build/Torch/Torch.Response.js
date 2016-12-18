"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch */
Torch.Response = function () {

  /**
   * @param {BungieNet.Platform.Response} resp
   * @param {Object} [obj={}]
   */
  function _class(resp) {
    var _this = this;

    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, _class);

    this.response = resp;
    Object.keys(obj).forEach(function (k) {
      return _this[k] = obj[k];
    });
  }

  /**
   * Whether this response is an error
   * @return {Boolean}
   */


  _createClass(_class, [{
    key: "isError",
    get: function get() {
      return this.response.isError;
    }
  }]);

  return _class;
}();
//# sourceMappingURL=Torch.Response.js.map