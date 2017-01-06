"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BungieNet = undefined;

require("./BungieNet/Common.js");

var _BungieNet = require("./BungieNet/BungieNet.js");

var _BungieNet2 = _interopRequireDefault(_BungieNet);

var _Platform = require("./BungieNet/Platform.js");

var _Platform2 = _interopRequireDefault(_Platform);

var _Plugin = require("./BungieNet/Plugin.js");

var _Plugin2 = _interopRequireDefault(_Plugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.BungieNet = _BungieNet2.default;


_BungieNet2.default.Platform = _Platform2.default;
_BungieNet2.default.Platform.Plugin = _Plugin2.default;