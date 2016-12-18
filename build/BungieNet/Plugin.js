"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

var _BungieNet = require("./BungieNet.js");

var _BungieNet2 = _interopRequireDefault(_BungieNet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Plugin base class for plugins. Each plugin MUST define an update method.
 *
 * void update( String: eventName, Array: args )
 */
var Plugin = function Plugin() {
  _classCallCheck(this, Plugin);
};

exports.default = Plugin;
;

Plugin.CookieJarMemoryPlugin = function (_Plugin) {
  _inherits(_class, _Plugin);

  function _class() {
    _classCallCheck(this, _class);

    var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

    _this.jar = _request2.default.jar();
    return _this;
  }

  _createClass(_class, [{
    key: "update",
    value: function update(eventName, e) {
      if (eventName === _BungieNet2.default.Platform.events.frameBeforeSend) {
        e.target.options.jar = this.jar;
      }
    }
  }]);

  return _class;
}(Plugin);

Plugin.OAuthPlugin = function (_Plugin2) {
  _inherits(_class2, _Plugin2);

  function _class2(accessToken) {
    _classCallCheck(this, _class2);

    var _this2 = _possibleConstructorReturn(this, (_class2.__proto__ || Object.getPrototypeOf(_class2)).call(this));

    _this2.accessToken = accessToken;
    return _this2;
  }

  _createClass(_class2, [{
    key: "update",
    value: function update(eventName, e) {
      if (eventName === _BungieNet2.default.Platform.events.frameBeforeSend) {
        e.target.options.headers["Authorization"] = "Bearer " + this.accessToken;
      }
    }
  }]);

  return _class2;
}(Plugin);
//# sourceMappingURL=Plugin.js.map