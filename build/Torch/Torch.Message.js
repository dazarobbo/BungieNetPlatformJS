"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch, moment */
Torch.Messsage = function () {
  function _class() {
    var o = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, _class);

    /**
     * @type {Object}
     */
    this._data = o;

    /**
     * @type {Map}
     */
    this._converted = new Map();

    /**
     * @type {Torch.User}
     */
    this.sender = null;

    /**
     * @type {Torch.Group[]}
     */
    this.group = null;
  }

  _createClass(_class, [{
    key: "_convert",
    value: function _convert() {

      this._converted.set("conversationId", new BigNumber(this._data.conversationId));

      this._converted.set("dateSent", moment(this._data.dateSent));

      this._converted.set("memberFromId", new BigNumber(this._data.memberFromId));

      this._converted.set("messageId", new BigNumber(this._data.messageId));
    }

    /**
     * @return {String}
     */

  }, {
    key: "toString",


    /**
     * @return {String}
     */
    value: function toString() {
      return this.body;
    }
  }, {
    key: "body",
    get: function get() {
      return this._data.body;
    }

    /**
     * @return {String}
     */

  }, {
    key: "conversationId",
    get: function get() {
      return this._converted.get("conversationId");
    }

    /**
     * @return {Moment}
     */

  }, {
    key: "dateSent",
    get: function get() {
      return this._converted.get("dateSent");
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isAutoResponse",
    get: function get() {
      return this._data.isAutoResponse;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isDeleted",
    get: function get() {
      return this._data.isDeleted;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "memberFromId",
    get: function get() {
      return new BigNumber(this._data.memberFromId);
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "messageId",
    get: function get() {
      return this._converted.get("messageId");
    }
  }]);

  return _class;
}();
//# sourceMappingURL=Torch.Message.js.map