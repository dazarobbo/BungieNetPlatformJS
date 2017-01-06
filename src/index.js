import "./Common.js";
import { default as BungieNet } from "./BungieNet.js";
import { default as Platform } from "./Platform.js";
import { default as Plugin } from "./Plugin.js";
export { BungieNet };

BungieNet.Platform = Platform;
BungieNet.Platform.Plugin = Plugin;
