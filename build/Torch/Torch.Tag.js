"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch */
/**
 * @example
 *
 * let t = new Torch.Tag("#Bungie");
 *
 * t.hash; //#bungie
 * t.raw; //Bungie
 * t.toString(); //#bungie
 */
Torch.Tag = function () {

  /**
   * @param {String} str - string containing a tag or hash tag
   */
  function _class(str) {
    _classCallCheck(this, _class);

    this._tag = Torch.Tag._trim(str);
  }

  /**
   * Strips excess tag data
   * @param {String} str eg. "#Bungie"
   * @return {String}
   */


  _createClass(_class, [{
    key: "toString",


    /**
     * Normalised version of this tag
     * @return {String} eg. "#bungie"
     */
    value: function toString() {
      return this._tag.toLowerCase();
    }
  }, {
    key: "hash",


    /**
     * Returns the tag as a hash tag
     * @return {String} eg. "#bungie"
     */
    get: function get() {
      return "#" + this.toString();
    }

    /**
     * The raw, non-normalised tag
     * @return {String} eg. "Bungie"
     */

  }, {
    key: "raw",
    get: function get() {
      return this._tag;
    }
  }], [{
    key: "_trim",
    value: function _trim(str) {
      return str.trim().replace("#", "");
    }
  }]);

  return _class;
}();
//# sourceMappingURL=Torch.Tag.js.map