"use strict";

import request from "request";
import BungieNet from "./BungieNet.js";

/**
 * Plugin base class for plugins. Each plugin MUST define an update method.
 *
 * void update( String: eventName, Array: args )
 */
export default class Plugin {

  constructor() {

  }

};

Plugin.CookieJarMemoryPlugin = class extends Plugin {

  constructor() {
    super();
    this.jar = request.jar();
  }

  update(eventName, e) {
    if(eventName === BungieNet.Platform.events.frameBeforeSend) {
      e.target.options.jar = this.jar;
    }
  }

}

Plugin.OAuthPlugin = class extends Plugin {

  constructor(accessToken) {
    super();
    this.accessToken = accessToken;
  }

  update(eventName, e) {
    if(eventName === BungieNet.Platform.events.frameBeforeSend) {
      e.target.options.headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
  }

}
