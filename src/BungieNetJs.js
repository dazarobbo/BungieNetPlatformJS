"use strict";

import "./BungieNet/Common.js";
import { default as BungieNet } from "./BungieNet/BungieNet.js";
import { default as Platform } from "./BungieNet/Platform.js";
import { default as Plugin } from "./BungieNet/Plugin.js";
export { BungieNet as default };

BungieNet.Platform = Platform;
BungieNet.Platform.Plugin = Plugin;
