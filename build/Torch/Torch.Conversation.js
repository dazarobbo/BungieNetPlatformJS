"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch, moment */
Torch.Conversation = function () {
  function _class() {
    var o = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, _class);

    /**
     * Raw data from bungie.net
     * @type {Object}
     */
    this._data = o;

    /**
     * Converted data
     * @type {Map}
     */
    this._converted = new Map();

    /**
     * @type {Torch.Messsage[]}
     */
    this.messages = [];

    this._convert();
  }

  _createClass(_class, [{
    key: Symbol.iterator,
    value: regeneratorRuntime.mark(function value() {
      return regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.delegateYield(this.messages, "t0", 1);

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, value, this);
    })
  }, {
    key: "_convert",
    value: function _convert() {

      this._converted.set("conversationId", new BigNumber(this._data.conversationId));

      this._converted.set("dateStarted", moment(this._data.dateStarted));

      this._converted.set("lastMessageId", new BigNumber(this._data.lastMessageId));

      this._converted.set("lastMessageSent", moment(this._data.lastMessageSent));

      this._converted.set("lastRead", moment(this._data.lastRead));

      this._converted.set("memberFromId", new BigNumber(this._data.memberFromId));

      this._converted.set("ownerEntityId", new BigNumber(this._data.ownerEntityId));

      this._converted.set("starter", new BigNumber(this._data.starter));

      this._converted.set("targetMembershipId", new BigNumber(this._data.targetMembershipId));
    }

    /**
     * @return {String}
     */

  }, {
    key: "body",
    get: function get() {
      return this._data.body;
    }

    /**
     * @return {BigNumber}
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
    key: "dateStarted",
    get: function get() {
      return this._converted.get("dateStarted");
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
    key: "isGlobal",
    get: function get() {
      return this._data.isGlobal;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isLocked",
    get: function get() {
      return this._data.isLocked;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isRead",
    get: function get() {
      return this._data.isRead;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "lastMessageId",
    get: function get() {
      return this._converted.get("lastMessageId");
    }

    /**
     * @return {Moment}
     */

  }, {
    key: "lastMessageSent",
    get: function get() {
      return this._converted.get("lastMessageSent");
    }

    /**
     * @return {Moment}
     */

  }, {
    key: "lastRead",
    get: function get() {
      return this._converted.get("lastRead");
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "memberFromId",
    get: function get() {
      return this._converted.get("memberFromId");
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "ownerEntityId",
    get: function get() {
      return this._converted.get("ownerEntityId");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "ownerEntityType",
    get: function get() {
      return this._data.ownerEntityType;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "starter",
    get: function get() {
      return this._converted.get("starter");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "status",
    get: function get() {
      return this._data.status;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "targetMembershipId",
    get: function get() {
      return this._converted.get("targetMembershipId");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "totalMessageCount",
    get: function get() {
      return this._data.totalMessageCount;
    }
  }]);

  return _class;
}();