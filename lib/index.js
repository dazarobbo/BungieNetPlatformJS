"use strict";

require("./Common.js");

var _BungieNet = require("./BungieNet.js");

var _Platform = require("./Platform.js");

var _Platform2 = _interopRequireDefault(_Platform);

var _Plugin = require("./Plugin.js");

var _Plugin2 = _interopRequireDefault(_Plugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_BungieNet.BungieNet.Platform = _Platform2.default;
_BungieNet.BungieNet.Platform.Plugin = _Plugin2.default;