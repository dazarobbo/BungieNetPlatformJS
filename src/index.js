import "./Common.js";
import { BungieNet } from "./BungieNet.js";
import { default as Platform } from "./Platform.js";
import { default as Plugin } from "./Plugin.js";

BungieNet.Platform = Platform;
BungieNet.Platform.Plugin = Plugin;
