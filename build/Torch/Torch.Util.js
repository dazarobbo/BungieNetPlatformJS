"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch */
Torch.Util = function () {
  function _class() {
    _classCallCheck(this, _class);
  }

  _createClass(_class, null, [{
    key: "htmlEncode",


    /**
     * HTML encode a string
     * @param {String} str
     * @return {String}
     */
    value: function htmlEncode(str) {

      if (document) {
        return document.createElement("a").appendChild(document.createTextNode(str)).parentNode.innerHTML;
      }

      return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /**
     * HTML decodes a string
     * @param {String} str
     * @return {String}
     */

  }, {
    key: "htmlDecode",
    value: function htmlDecode(str) {

      if (document) {
        var a = document.createElement("s");a.innerHTML = str;
        return a.textContent;
      }

      return str.replace(/&#(\d+);/g, function (match, dec) {
        return String.fromCharCode(dec);
      }).replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    }
  }]);

  return _class;
}();
//# sourceMappingURL=Torch.Util.js.map