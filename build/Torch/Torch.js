"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bungienetplatformjs = require("bungienetplatformjs");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * BungieNet Platform middleware
 */
var Torch = function () {

  /**
   * @param {Platform} p
   */
  function Torch(p) {
    _classCallCheck(this, Torch);

    this._platform = p;
  }

  /**
   * @type {Platform}
   */


  _createClass(Torch, [{
    key: "getConversations",


    /**
     * @param  {Number} [page=1]
     * @return {Promise<Torch.Conversation[]>}
     */
    value: function getConversations() {
      var _this = this;

      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      return new Promise(function (resolve, reject) {
        _this._platform.getConversationsV5(page).then(function (resp) {

          var convs = resp.response.results.map(function (r) {

            var c = new Torch.Conversation(r.detail);

            //create a message object from the initial conversation
            //details and add it as a message of the conversation
            var m = new Torch.Message({
              body: r.detail.body,
              conversationId: r.detail.conversationId,
              dateSent: r.detail.lastMessageSent,
              isAutoResponse: r.detail.isAutoResponse,
              isDeleted: false, //hardcoded!
              memberFromId: r.detail.memberFromId,
              messageId: r.detail.lastMessageId
            });

            //get user details
            m.sender = new Torch.User(Object.values(resp.response.users).find(function (u) {
              return u.membershipId === r.detail.memberFromId;
            }));

            c.messages.push(m);

            return c;
          });

          return resolve(new Torch.Response(resp, {
            conversations: convs
          }));
        }, reject);
      });
    }

    /**
     * @param  {String} id
     * @param  {Number} [page=1]
     * @return {Promise.<Torch.Conversation>}
     */

  }, {
    key: "getConversationThread",
    value: function getConversationThread(id) {
      var _this2 = this;

      var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      return new Promise(function (resolve, reject) {
        _this2._platform.getConversationThread(id, page).then(function (resp) {

          var conv = new Torch.Conversation({
            conversationId: id
          });

          conv.messages = resp.response.results.map(function (m) {

            var msg = new Torch.Message(m);

            msg.sender = new Torch.User(Object.values(resp.response.users).find(function (u) {
              return u.membershipId === m.memberFromId;
            }));

            return msg;
          });

          return resolve(new Torch.Response(resp, {
            conversation: conv
          }));
        }, reject);
      });
    }

    /**
     * @param  {String} id
     * @return {Promise.<Torch.Response>}
     */

  }, {
    key: "getConversationById",
    value: function getConversationById(id) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3._platform.getConversationByIdV2(id).then(function (resp) {});
      });
    }
  }, {
    key: "platform",
    get: function get() {
      return this._platform;
    }

    /**
     * @param {Platform}
     */
    ,
    set: function set(p) {
      this._platform = p;
    }
  }]);

  return Torch;
}();

exports.default = Torch;
//# sourceMappingURL=Torch.js.map